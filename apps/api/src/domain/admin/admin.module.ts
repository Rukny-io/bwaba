import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { StoresController } from './stores/stores.controller';
import { StoresService } from './stores/stores.service';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
import { OrdersController } from './orders/orders.controller';
import { OrdersService } from './orders/orders.service';
import { VerificationController } from './verification/verification.controller';
import { WallpapersController } from './wallpapers/wallpapers.controller';
import { PublicWallpapersController } from './wallpapers/public-wallpapers.controller';
import { WallpapersService } from './wallpapers/wallpapers.service';
import { AdminFormsController } from './forms/forms.controller';
import { AdminFormsService } from './forms/forms.service';
import { AdminMailController } from './mail/admin-mail.controller';
import { AdminMailService } from './mail/admin-mail.service';
import { AnalyticsController } from './analytics/analytics.controller';
import { AnalyticsService } from './analytics/analytics.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../../integrations/email/email.module';
import { WhatsappModule } from '../../integrations/whatsapp/whatsapp.module';
import { WhatsAppBusinessModule } from '../../integrations/whatsapp-business/whatsapp-business.module';
import { SecurityModule } from '../../infrastructure/security/security.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
    EmailModule,
    WhatsappModule,
    WhatsAppBusinessModule,
    SecurityModule,
    MailModule,
  ],
  controllers: [
    DashboardController,
    UsersController,
    StoresController,
    ProductsController,
    OrdersController,
    VerificationController,
    WallpapersController,
    PublicWallpapersController,
    AdminFormsController,
    AdminMailController,
    AnalyticsController,
  ],
  providers: [
    DashboardService,
    UsersService,
    StoresService,
    ProductsService,
    OrdersService,
    WallpapersService,
    AdminFormsService,
    AdminMailService,
    AnalyticsService,
  ],
})
export class AdminModule {}
