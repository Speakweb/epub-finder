import {Request, Response} from "express";
import {Body, Controller, Get, Post, Req, Res, HttpCode, UseGuards} from "@nestjs/common";
import {promisify} from "util";

import {User} from "../entities/user.entity";
import {UsersService} from "../user/users.service";
import { Public } from "src/decorators/public";
import {UserFromReq} from "../decorators/userFromReq";
import {FacebookGuard, GoogleGuard, LoginGuard} from "../guards";
import {GithubGuard} from "../guards/github";
import {TwitterGuard} from "../guards/twitter";

@Controller("/auth")
export class AuthController {
  constructor(private readonly userService: UsersService) {}

  @Public()
  @UseGuards(LoginGuard)
  @Post("/login")
  public login(@UserFromReq() user: User): User {
    return user;
  }

  @Public()
  @HttpCode(204)
  @Get("/logout")
  public logout(@Req() req: Request, @Res() res: Response): void {
    // @ts-ignore
    req.session.destroy();
    req.logout();
    res.clearCookie("nest");
    res.send("");
  }

  @Public()
  @Get("/google")
  @UseGuards(GoogleGuard)
  public googleLogin(): void {
    // initiates the Google OAuth2 login flow
  }

  @Public()
  @Get("/google/callback")
  @UseGuards(GoogleGuard)
  public googleLoginCallback(@UserFromReq() user: User): string {
      return '';
  }
  @Public()
  @Get("/github")
  @UseGuards(GithubGuard)
  public githubLogin(): void {
    // initiates the Github OAuth2 login flow
  }

  @Public()
  @Get("/github/callback")
  @UseGuards(GithubGuard)
  public githubLoginCallback(@UserFromReq() user: User): string {
    return '';
  }
  @Public()
  @Get("/twitter")
  @UseGuards(TwitterGuard)
  public twitterLogin(): void {
    // initiates the Twitter OAuth2 login flow
  }

  @Public()
  @Get("/twitter/callback")
  @UseGuards(TwitterGuard)
  public twitterLoginCallback(@UserFromReq() user: User): string {
    return '';
  }
  @Public()
  @Get("/facebook")
  @UseGuards(FacebookGuard)
  public facebookLogin(): void {
    // initiates the Facebook OAuth2 login flow
  }

  @Public()
  @Get("/facebook/callback")
  @UseGuards(FacebookGuard)
  public facebookLoginCallback(@UserFromReq() user: User): string {
    return '';
  }

  @Public()
  @Get('third-party-logins')
  public thirdPartyOptions() {
    return {
      settings: [
        {
          thirdPartyName: 'google',
        },
        {
          thirdPartyName: 'facebook',
        },
        {
          thirdPartyName: 'twitter',
        }
      ]
    }
  }
}
