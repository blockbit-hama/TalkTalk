import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// 개발 환경에서는 메모리에 저장, 프로덕션에서는 Vercel KV 사용
interface PhoneMapping {
  phoneNumber: string;
  walletAddress: string;
  userName: string;
  createdAt: string;
}

// 메모리 저장소 (개발용)
const phoneMapping: Map<string, PhoneMapping> = new Map();

// KV 연결 상태 확인
const isKVAvailable = () => {
  return process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
};

// 전화번호 매핑 저장 함수
async function savePhoneMapping(phoneNumber: string, mapping: PhoneMapping): Promise<void> {
  try {
    if (isKVAvailable()) {
      await kv.set(`phone:${phoneNumber}`, mapping);
      console.log(`✅ KV에 전화번호 매핑 저장: ${phoneNumber}`);
    } else {
      phoneMapping.set(phoneNumber, mapping);
      console.log(`✅ 메모리에 전화번호 매핑 저장: ${phoneNumber}`);
    }
  } catch (error) {
    console.error('KV 저장 실패, 메모리 사용:', error);
    phoneMapping.set(phoneNumber, mapping);
  }
}

// 전화번호 매핑 조회 함수
async function getPhoneMapping(phoneNumber: string): Promise<PhoneMapping | null> {
  try {
    if (isKVAvailable()) {
      const mapping = await kv.get<PhoneMapping>(`phone:${phoneNumber}`);
      if (mapping) {
        console.log(`📞 KV에서 전화번호 조회 성공: ${phoneNumber}`);
      }
      return mapping;
    } else {
      return phoneMapping.get(phoneNumber) || null;
    }
  } catch (error) {
    console.error('KV 조회 실패, 메모리 사용:', error);
    return phoneMapping.get(phoneNumber) || null;
  }
}

// 모든 매핑 조회 (디버그용)
async function getAllMappings(): Promise<Array<[string, PhoneMapping]>> {
  try {
    if (isKVAvailable()) {
      const keys = await kv.keys('phone:*');
      const mappings: Array<[string, PhoneMapping]> = [];
      for (const key of keys) {
        const mapping = await kv.get<PhoneMapping>(key);
        if (mapping) {
          const phoneNumber = key.replace('phone:', '');
          mappings.push([phoneNumber, mapping]);
        }
      }
      return mappings;
    } else {
      return Array.from(phoneMapping.entries());
    }
  } catch (error) {
    console.error('전체 조회 실패, 메모리 사용:', error);
    return Array.from(phoneMapping.entries());
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, walletAddress, userName } = await request.json();

    console.log('📞 전화번호 매핑 요청:', { phoneNumber, walletAddress, userName });

    // 입력 검증
    if (!phoneNumber || !walletAddress || !userName) {
      return NextResponse.json(
        { error: '전화번호, 지갑 주소, 이름이 모두 필요합니다.' },
        { status: 400 }
      );
    }

    // 전화번호 형식 간단 검증
    const cleanPhoneNumber = phoneNumber.replace(/[-\s]/g, '');
    if (!/^01[0-9]{8,9}$/.test(cleanPhoneNumber)) {
      return NextResponse.json(
        { error: '올바른 전화번호 형식이 아닙니다. (010-XXXX-XXXX)' },
        { status: 400 }
      );
    }

    // 지갑 주소 형식 검증 (XRPL 주소)
    if (!/^r[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: '올바른 XRPL 지갑 주소가 아닙니다.' },
        { status: 400 }
      );
    }

    // 이름 검증
    if (userName.trim().length < 1 || userName.trim().length > 20) {
      return NextResponse.json(
        { error: '이름은 1~20자 사이여야 합니다.' },
        { status: 400 }
      );
    }

    const mapping: PhoneMapping = {
      phoneNumber: cleanPhoneNumber,
      walletAddress,
      userName: userName.trim(),
      createdAt: new Date().toISOString(),
    };

    // 저장 (KV 또는 메모리)
    await savePhoneMapping(cleanPhoneNumber, mapping);

    // 현재 저장된 매핑 수 확인
    const allMappings = await getAllMappings();
    console.log('📊 현재 저장된 매핑 수:', allMappings.length);
    console.log('💾 저장소 타입:', isKVAvailable() ? 'Vercel KV' : 'Memory');

    return NextResponse.json({
      success: true,
      message: '전화번호가 성공적으로 등록되었습니다.',
      phoneNumber: cleanPhoneNumber,
      storage: isKVAvailable() ? 'KV' : 'Memory'
    });

  } catch (error) {
    console.error('❌ 전화번호 매핑 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber');
    const walletAddress = searchParams.get('walletAddress');

    console.log('📞 조회 요청:', { phoneNumber, walletAddress });

    // 전화번호 또는 지갑주소 중 하나는 필요
    if (!phoneNumber && !walletAddress) {
      return NextResponse.json(
        { error: '전화번호 또는 지갑주소가 필요합니다.' },
        { status: 400 }
      );
    }

    // 현재 저장된 매핑들 확인
    const allMappings = await getAllMappings();
    console.log('💾 저장소 타입:', isKVAvailable() ? 'Vercel KV' : 'Memory');

    let mapping = null;

    if (phoneNumber) {
      // 전화번호로 조회
      const cleanPhoneNumber = phoneNumber.replace(/[-\s]/g, '');
      console.log('🧹 정리된 전화번호:', cleanPhoneNumber);
      mapping = await getPhoneMapping(cleanPhoneNumber);

      if (!mapping) {
        console.log('❌ 전화번호를 찾을 수 없음:', cleanPhoneNumber);
        return NextResponse.json(
          { error: '해당 전화번호를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
    } else if (walletAddress) {
      // 지갑주소로 역조회
      console.log('🔍 지갑주소로 역조회:', walletAddress);

      // 모든 매핑에서 지갑주소로 찾기
      for (const [phone, phoneMapping] of allMappings) {
        if (phoneMapping.walletAddress === walletAddress) {
          mapping = phoneMapping;
          break;
        }
      }

      if (!mapping) {
        console.log('❌ 지갑주소를 찾을 수 없음:', walletAddress);
        return NextResponse.json(
          { error: '해당 지갑주소를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
    }

    console.log('📞 조회 성공:', mapping);

    return NextResponse.json({
      success: true,
      phoneNumber: mapping.phoneNumber,
      walletAddress: mapping.walletAddress,
      userName: mapping.userName,
      storage: isKVAvailable() ? 'KV' : 'Memory'
    });

  } catch (error) {
    console.error('❌ 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 개발용: 모든 매핑 조회
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const debug = searchParams.get('debug');

    if (debug === 'list') {
      const allMappings = Array.from(phoneMapping.entries()).map(([phone, data]) => ({
        phoneNumber: phone,
        walletAddress: data.walletAddress,
        createdAt: data.createdAt,
      }));

      return NextResponse.json({
        success: true,
        count: phoneMapping.size,
        mappings: allMappings,
      });
    }

    return NextResponse.json(
      { error: 'Invalid operation' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ 디버그 요청 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}