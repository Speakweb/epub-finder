import {
    Entity,
    Column,
    PrimaryColumn,
    PrimaryGeneratedColumn,
    AfterLoad,
    BeforeUpdate,
    BeforeInsert,
    OneToMany, Repository, ManyToOne, JoinTable
} from "typeorm";

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import {UsageEventEntity} from "./usage-event.entity";
import {JsonValueTransformer} from "../util/JsonValueTransformer";
import {UsageEntity} from "./usage.entity";
import {SessionEntity} from "./session.entity";
import {BookViewEntity} from "./book-view.entity";

@Entity()
export class UserEntity {
    // If a user has no tokens or emails, it's an ip user
    public static IpUserCriteria = {
        email: null,
        tokens: ''
    };
    @PrimaryGeneratedColumn()
    id: number | undefined;
    @Column({unique: true, default: null})
    email: string | null; // { type: String, unique: true },
    @Column()
    password: string = '';
    @Column()
    passwordResetToken: string = '';
    @Column()
    passwordResetExpires: Date = new Date(); // I have no idea if this will break anything
    @Column()
    emailVerificationToken: string = '';
    @Column()
    emailVerified: boolean = false;
    @Column()
    snapchat: string = '';
    @Column()
    facebook: string = '';
    @Column()
    twitter: string = '';
    @Column()
    google: string = '';
    @Column()
    github: string = '';
    @Column()
    instagram: string = '';
    @Column()
    linkedin: string = '';
    @Column()
    steam: string = '';
    @Column()
    twitch: string = '';
    @Column()
    quickbooks: string = '';
    // I wonder what the ORM will do with this?
    @Column({
        type: String,
        transformer: new JsonValueTransformer<string[]>()
    })
    tokens: string[] = [];
    @Column()
    profile_name: string = '';
    @Column()
    profile_gender: string = '';
    @Column()
    profile_location: string = '';
    @Column()
    profile_website: string = '';
    @Column()
    profile_picture: string = '';

    @Column()
    ip: string = '';

    private _loadedPassword: string;

    @OneToMany(() => BookViewEntity, (book: BookViewEntity) => book.creatorId)
    @JoinTable()
    books: Promise<BookViewEntity[]>;


    @OneToMany(type => UsageEventEntity, (usageEvent: UsageEventEntity) => usageEvent.userId)
    usageEvents: UsageEventEntity[];

    @OneToMany(type => SessionEntity, (session: SessionEntity) => session.userId)
    sessions: SessionEntity[];

    @AfterLoad()
    private storeInitialPassword(): void {
        this._loadedPassword = this.password;
    }

    @BeforeInsert()
    @BeforeUpdate()
    private async encryptPassword(): Promise<void> {
        if (this._loadedPassword !== this.password) {
            const salt = await bcrypt.genSalt(10);
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

    public static comparePassword(currentPassword: string, attemptingPassword: string) {
        return new Promise((resolve, reject) => {
            bcrypt.compare(attemptingPassword, currentPassword, (err, res) => {
                if (err) reject(err);
                if (res) resolve(true);
                resolve(false);
            })
        });
    }

    public async usageStat(r: Repository<UsageEntity>): Promise<UsageEntity> {
        return r.findOne({userId: this.id})
    }

}
