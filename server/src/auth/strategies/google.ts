import {OAuth2Strategy} from "passport-google-oauth";
import {PassportStrategy} from "@nestjs/passport";
import {Injectable, UnauthorizedException} from "@nestjs/common";

import {User} from "../../entities/User";
import {UsersService} from "../../user/users.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(OAuth2Strategy, "google") {
    constructor(private readonly userService: UsersService) {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            scope: ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"],
        });
    }

    public async validate(_accessToken: string, _refreshToken: string, profile: any): Promise<User> {
        const user = await this.userService.findOne({
            email: profile.emails[0].value
        });
        if (user) {
            return user;
        }
        throw new UnauthorizedException();
    }
}
