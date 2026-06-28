import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET() {
  try {
    const snap = await adminDb
      .collection('quests')
      .orderBy('postedAt', 'desc')
      .limit(50)
      .get();

    const quests = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ quests });
  } catch (err) {
    console.error('GET /api/quests', err);
    return NextResponse.json({ error: 'Failed to fetch quests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);

    const body = await req.json();
    const { title, description, category, reward, difficulty, deadline, maxApplicants } = body;

    if (!title || !description || !category || !reward) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const docRef = await adminDb.collection('quests').add({
      title,
      description,
      category,
      reward: Number(reward),
      difficulty: difficulty ?? 'medium',
      deadline: deadline ?? null,
      maxApplicants: Number(maxApplicants ?? 1),
      applicantCount: 0,
      status: 'recruiting',
      questionerId: decoded.uid,
      questioner: decoded.name ?? decoded.email ?? '익명',
      postedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/quests', err);
    return NextResponse.json({ error: 'Failed to create quest' }, { status: 500 });
  }
}
