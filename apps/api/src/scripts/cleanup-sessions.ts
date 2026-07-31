import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupExpiredSessions() {
  console.log('🧹 Starting session cleanup...\n');

  try {
    // 1. عرض إحصائيات الجلسات
    const stats = await prisma.session.groupBy({
      by: ['isRevoked'],
      _count: true,
    });

    console.log('📊 Session Statistics:');
    stats.forEach((stat) => {
      console.log(
        `  ${stat.isRevoked ? '❌' : '✅'} ${stat.isRevoked ? 'Revoked' : 'Active'}: ${stat._count} sessions`,
      );
    });

    // 2. حذف الجلسات المنتهية منذ أكثر من 7 أيام
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const deletedExpired = await prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: sevenDaysAgo } },
          { refreshExpiresAt: { lt: sevenDaysAgo } },
        ],
      },
    });

    console.log(
      `\n🗑️  Deleted ${deletedExpired.count} expired sessions (older than 7 days)`,
    );

    // 3. إبطال الجلسات المنتهية (لكن لم تُحذف بعد)
    const now = new Date();
    const revokedExpired = await prisma.session.updateMany({
      where: {
        isRevoked: false,
        OR: [{ expiresAt: { lt: now } }, { refreshExpiresAt: { lt: now } }],
      },
      data: {
        isRevoked: true,
        revokedReason: 'Auto-revoked: Session expired',
        revokedAt: now,
      },
    });

    console.log(`🔒 Revoked ${revokedExpired.count} expired sessions`);

    // 4. عرض الجلسات النشطة مع مستخدميها
    console.log('\n👥 Active Sessions:');
    const activeSessions = await prisma.session.findMany({
      where: {
        isRevoked: false,
        refreshExpiresAt: { gt: now },
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: { lastActivity: 'desc' },
      take: 10,
    });

    if (activeSessions.length === 0) {
      console.log('  No active sessions found');
    } else {
      activeSessions.forEach((session, index) => {
        const lastActivity = new Date(session.lastActivity);
        const timeSinceActivity = Math.floor(
          (Date.now() - lastActivity.getTime()) / 1000 / 60,
        );

        console.log(`\n  ${index + 1}. ${session.user.email}`);
        console.log(`     Session ID: ${session.id}`);
        console.log(`     Device: ${session.deviceType || 'Unknown'}`);
        console.log(`     Browser: ${session.browser || 'Unknown'}`);
        console.log(`     OS: ${session.os || 'Unknown'}`);
        console.log(`     IP: ${session.ipAddress || 'N/A'}`);
        console.log(`     Last Activity: ${timeSinceActivity} minutes ago`);
        console.log(`     Rotation Count: ${session.rotationCount}`);
        console.log(
          `     Expires At: ${session.refreshExpiresAt?.toLocaleString('en-US')}`,
        );
      });
    }

    // 5. إحصائيات مستخدمي الجلسات النشطة
    console.log('\n📈 Active Users:');
    const activeUsers = await prisma.session.groupBy({
      by: ['userId'],
      where: {
        isRevoked: false,
        refreshExpiresAt: { gt: now },
      },
      _count: true,
    });

    console.log(`  Total Active Users: ${activeUsers.length}`);
    console.log(
      `  Total Active Sessions: ${activeUsers.reduce((sum, u) => sum + u._count, 0)}`,
    );

    console.log('\n✅ Session cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Error during session cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل الـ script
cleanupExpiredSessions().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
