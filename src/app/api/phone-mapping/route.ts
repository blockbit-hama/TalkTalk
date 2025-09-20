import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// Redis 전용 전화번호 매핑 저장소
interface PhoneMapping {
  phoneNumber: string;
  walletAddress: string;
  userName: string;
  createdAt: string;
}

// KV 연결 상태 확인
const isKVAvailable = () => {
  return process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
};

// 전화번호 매핑 저장 함수 - Redis 전용
async function savePhoneMapping(phoneNumber: string, mapping: PhoneMapping): Promise<void> {
  if (!isKVAvailable()) {
    throw new Error('Redis 연결 정보가 없습니다. KV_REST_API_URL과 KV_REST_API_TOKEN을 확인하세요.');
  }

  try {
    await kv.set(`phone:${phoneNumber}`, mapping);
    console.log(`✅ Redis에 전화번호 매핑 저장: ${phoneNumber}`);
  } catch (error) {
    console.error('❌ Redis 저장 실패:', error);
    throw new Error(`Redis 저장 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 전화번호 매핑 조회 함수 - Redis 전용
async function getPhoneMapping(phoneNumber: string): Promise<PhoneMapping | null> {
  if (!isKVAvailable()) {
    throw new Error('Redis 연결 정보가 없습니다. KV_REST_API_URL과 KV_REST_API_TOKEN을 확인하세요.');
  }

  try {
    const mapping = await kv.get<PhoneMapping>(`phone:${phoneNumber}`);
    if (mapping) {
      console.log(`📞 Redis에서 전화번호 조회 성공: ${phoneNumber}`);
    }
    return mapping;
  } catch (error) {
    console.error('❌ Redis 조회 실패:', error);
    throw new Error(`Redis 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 모든 매핑 조회 (디버그용) - Redis 전용
export async function getAllMappings(): Promise<Array<[string, PhoneMapping]>> {
  if (!isKVAvailable()) {
    throw new Error('Redis 연결 정보가 없습니다. KV_REST_API_URL과 KV_REST_API_TOKEN을 확인하세요.');
  }

  try {
    const keys = await kv.keys('phone:*');
    const mappings: Array<[string, PhoneMapping]> = [];

    for (const key of keys) {
      const mapping = await kv.get<PhoneMapping>(key);
      if (mapping) {
        const phoneNumber = key.replace('phone:', '');
        mappings.push([phoneNumber, mapping]);
      }
    }

    console.log(`📞 Redis에서 모든 전화번호 매핑 조회 완료: ${mappings.length}개`);
    return mappings;
  } catch (error) {
    console.error('❌ Redis 전체 조회 실패:', error);
    throw new Error(`Redis 전체 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    // 저장 (Redis 전용)
    await savePhoneMapping(cleanPhoneNumber, mapping);

    // 현재 저장된 매핑 수 확인 (실패해도 진행)
    try {
      const allMappings = await getAllMappings();
      console.log('📊 현재 저장된 매핑 수:', allMappings.length);
    } catch (error) {
      console.warn('매핑 수 확인 실패 (무시됨):', error);
    }
    console.log('💾 저장소 타입: Redis');

    return NextResponse.json({
      success: true,
      message: '전화번호가 성공적으로 등록되었습니다.',
      phoneNumber: cleanPhoneNumber,
      storage: 'Redis'
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
    console.log('💾 저장소 타입:', isKVAvailable() ? 'KV' : 'Memory');

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
      storage: 'Redis'
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
      const allMappings = await getAllMappings();
      const formattedMappings = allMappings.map(([phone, data]) => ({
        phoneNumber: phone,
        walletAddress: data.walletAddress,
        userName: data.userName,
        createdAt: data.createdAt,
      }));

      return NextResponse.json({
        success: true,
        count: allMappings.length,
        mappings: formattedMappings,
        storage: 'Redis'
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