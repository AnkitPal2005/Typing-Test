import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const format = searchParams.get('format') || 'pdf';

  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
  }

  try {
    const test = await prisma.typingTest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!test) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (format === 'csv') {
      const csv = `Username,WPM,Accuracy,Mistakes,Duration,DateAttempted\n${
        test.user.username
      },${test.wpm.toFixed(1)},${test.accuracy.toFixed(1)},${test.mistakes},${
        test.duration
      },${test.dateAttempted.toISOString()}`;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="TypingResult_${id}.csv"`,
        },
      });
    }

    // Pure PDF-1.4 structure
    const content =
      `BT\n/F1 24 Tf\n70 700 Td\n(WottaCore - Next.js Typing Test Certificate) Tj\nET\n` +
      `BT\n/F2 14 Tf\n70 650 Td\n(User: ${test.user.username}) Tj\nET\n` +
      `BT\n/F2 14 Tf\n70 610 Td\n(WPM: ${test.wpm.toFixed(2)}) Tj\nET\n` +
      `BT\n/F2 14 Tf\n70 580 Td\n(Accuracy: ${test.accuracy.toFixed(2)}%) Tj\nET\n` +
      `BT\n/F2 14 Tf\n70 550 Td\n(Mistakes: ${test.mistakes}) Tj\nET\n` +
      `BT\n/F2 14 Tf\n70 520 Td\n(Duration: ${test.duration} seconds) Tj\nET\n` +
      `BT\n/F2 12 Tf\n70 480 Td\n(Date Attempted: ${test.dateAttempted.toISOString()}) Tj\nET\n` +
      `BT\n/F1 12 Tf\n70 420 Td\n(Keep typing and improving your speed with WottaCore!) Tj\nET\n`;

    const pdf =
      `%PDF-1.4\n` +
      `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n` +
      `2 0 obj\n<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>\nendobj\n` +
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [ 0 0 612 792 ] /Contents 5 0 R >>\nendobj\n` +
      `4 0 obj\n<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>\nendobj\n` +
      `5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n` +
      `xref\n0 6\n0000000000 65535 f \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n10\n%%EOF\n`;

    return new NextResponse(Buffer.from(pdf, 'ascii'), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="TypingResult_${id}.pdf"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
