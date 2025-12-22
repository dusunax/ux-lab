import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

// Firebase 프로젝트 설정
const firebaseConfig = {
  projectId: "project-afterglow-2025",
};

let dbInstance: Firestore | null = null;

/**
 * Firebase Admin SDK 초기화
 */
function initializeFirebase(): boolean {
  if (getApps().length > 0) {
    // 이미 초기화됨
    return true;
  }

  try {
    // 방법 1: 환경 변수에서 서비스 계정 키 사용
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountKey) {
      try {
        const serviceAccount = JSON.parse(serviceAccountKey);
        // 필수 필드 확인
        if (!serviceAccount.private_key || !serviceAccount.client_email) {
          console.error("서비스 계정 키에 필수 필드가 없습니다.");
          return false;
        }
        initializeApp({
          credential: cert(serviceAccount),
          projectId: firebaseConfig.projectId,
        });
        return true;
      } catch (parseError) {
        console.error("서비스 계정 키 JSON 파싱 실패:", parseError);
        return false;
      }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // 방법 2: GOOGLE_APPLICATION_CREDENTIALS 환경 변수 사용 (파일 경로)
      initializeApp({
        projectId: firebaseConfig.projectId,
      });
      return true;
    } else {
      // 개발 환경: 기본 인증 정보 사용 시도
      console.warn(
        "FIREBASE_SERVICE_ACCOUNT_KEY 또는 GOOGLE_APPLICATION_CREDENTIALS 환경 변수가 설정되지 않았습니다."
      );
      console.warn(
        "Firebase Admin SDK를 사용하려면 서비스 계정 키가 필요합니다."
      );
      // 기본 초기화 시도 (로컬 개발 환경에서만 작동할 수 있음)
      try {
        initializeApp({
          projectId: firebaseConfig.projectId,
        });
        return true;
      } catch (error) {
        console.error("Firebase Admin SDK 초기화 실패:", error);
        return false;
      }
    }
  } catch (error) {
    console.error("Firebase Admin SDK 초기화 중 오류:", error);
    return false;
  }
}

/**
 * Firestore 인스턴스 가져오기 (lazy initialization)
 */
export function getDb(): Firestore {
  if (!dbInstance) {
    if (!initializeFirebase()) {
      throw new Error(
        "Firebase Admin SDK가 초기화되지 않았습니다. FIREBASE_SERVICE_ACCOUNT_KEY 환경 변수를 설정해주세요."
      );
    }

    // 앱이 실제로 초기화되었는지 확인
    const apps = getApps();
    if (apps.length === 0) {
      throw new Error(
        "Firebase 앱이 초기화되지 않았습니다. 서비스 계정 키를 확인해주세요."
      );
    }

    try {
      dbInstance = getFirestore();
      if (!dbInstance) {
        throw new Error("Firestore 인스턴스를 가져올 수 없습니다.");
      }
    } catch (error) {
      console.error("Firestore 인스턴스 생성 실패:", error);
      throw new Error(
        "Firestore를 초기화할 수 없습니다. Firebase 설정을 확인해주세요."
      );
    }
  }
  return dbInstance;
}
