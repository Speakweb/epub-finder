import {Entity, Column, PrimaryColumn, PrimaryGeneratedColumn, AfterLoad, BeforeUpdate, BeforeInsert} from "typeorm";

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import {UsageEvent} from "./UsageEvent";
import {JsonValueTransformer} from "../util/JsonValueTransformer";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number | undefined;
    @Column({unique: true})
    email!: string; // { type: String, unique: true },
    @Column()
    password!: string;
    @Column()
    passwordResetToken!: string;
    @Column()
    passwordResetExpires!: Date;
    @Column()
    emailVerificationToken!: string;
    @Column()
    emailVerified!: boolean;
    @Column()
    snapchat!: string;
    @Column()
    facebook!: string;
    @Column()
    twitter!: string;
    @Column()
    google!: string;
    @Column()
    github!: string;
    @Column()
    instagram!: string;
    @Column()
    linkedin!: string;
    @Column()
    steam!: string;
    @Column()
    twitch!: string;
    @Column()
    quickbooks!: string;
    // I wonder what the ORM will do with this?
    @Column({type: String, transformer: new JsonValueTransformer<string[]>()})
    tokens!: string[];
    @Column()
    profile_name!: string;
    @Column()
    profile_gender!: string;
    @Column()
    profile_location!: string;
    @Column()
    profile_website!: string;
    @Column()
    profile_picture!: string

    private _loadedPassword: string;
    usageEvents: UsageEvent[];

    @AfterLoad()
    private storeInitialPassword(): void {
        this._loadedPassword = this.password;
    }

    @BeforeInsert()
    @BeforeUpdate()
    private async encryptPassword(): Promise<void> {
        if (this._loadedPassword !== this.password) {
            const salt = await bcrypt.getSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }
    }

    public gravatar(size) {
        if (!size) {
            size = 200;
        }
        if (!this.email) {
            return `https://gravatar.com/avatar/?s=${size}&d=retro`;
        }
        const md5 = crypto.createHash("md5").update(this.email).digest("hex");
        return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
    }
}

// TODO do I need to do this so that it can load entities by scanning the directory?
// module.exports = User;
// export default User;