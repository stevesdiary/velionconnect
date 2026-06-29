import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { UpdateProfileDto, UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.findById(user.sub);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Get('me/organizations')
  getOrganizations(@CurrentUser() user: JwtPayload) {
    return this.usersService.getUserOrganizations(user.sub);
  }
}
