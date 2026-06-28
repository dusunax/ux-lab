import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const body = await req.json();
    const { questId, nickname, reason, plan, schedule, desiredReward } = body;

    if (!questId || !nickname || !reason || !plan) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const questRef = adminDb.collection('quests').doc(questId);
    const applicationsRef = questRef.collection('applications');
    const duplicateQuery = applicationsRef.where('applicantId', '==', decoded.uid).limit(1);

    let newId: string | undefined;

    try {
      await adminDb.runTransaction(async (tx) => {
        // 중복 확인과 삽입을 단일 트랜잭션으로 묶어 TOCTOU race condition 방지.
        // tx.get() 이후 다른 요청이 끼어들면 Firestore가 트랜잭션을 retry하거나 abort하므로
        // 동일 uid의 중복 지원이 원자적으로 차단된다.
        const existing = await tx.get(duplicateQuery);
        if (!existing.empty) {
          throw Object.assign(new Error('Already applied'), { code: 'ALREADY_APPLIED' });
        }

        const newRef = applicationsRef.doc();
        newId = newRef.id;
        tx.set(newRef, {
          questId,
          nickname,
          reason,
          plan,
          schedule: schedule ?? null,
          desiredReward: Number(desiredReward ?? 0),
          applicantId: decoded.uid,
          appliedAt: FieldValue.serverTimestamp(),
        });
        tx.update(questRef, { applicantCount: FieldValue.increment(1) });
      });
    } catch (txErr) {
      if (txErr instanceof Error && (txErr as Error & { code?: string }).code === 'ALREADY_APPLIED') {
        return NextResponse.json({ error: 'Already applied' }, { status: 409 });
      }
      throw txErr;
    }

    return NextResponse.json({ id: newId }, { status: 201 });
  } catch (err) {
    console.error('POST /api/applications', err);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}
