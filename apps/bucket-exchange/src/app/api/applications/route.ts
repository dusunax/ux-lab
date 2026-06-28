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

    // 중복 지원 방지
    const existing = await adminDb
      .collection('quests')
      .doc(questId)
      .collection('applications')
      .where('applicantId', '==', decoded.uid)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ error: 'Already applied' }, { status: 409 });
    }

    const docRef = await adminDb
      .collection('quests')
      .doc(questId)
      .collection('applications')
      .add({
        questId,
        nickname,
        reason,
        plan,
        schedule: schedule ?? null,
        desiredReward: Number(desiredReward ?? 0),
        applicantId: decoded.uid,
        appliedAt: FieldValue.serverTimestamp(),
      });

    // applicantCount 증가
    await adminDb
      .collection('quests')
      .doc(questId)
      .update({ applicantCount: FieldValue.increment(1) });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/applications', err);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}
