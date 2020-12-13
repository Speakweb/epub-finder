import {ReplaySubject} from "rxjs";
import axios from 'axios';

export interface Profile {
    email: string;
}

export class LoggedInUserService {
    profile$ = new ReplaySubject<Profile | undefined>(1);

    public static async fetchLoggedInProfile(): Promise<Profile | undefined >{
        const response = await axios.get(`${process.env.PUBLIC_URL}/users/profile`);
        return response?.data as Profile;
    }

    constructor() {
        this.profile$.next(undefined)
        // Right now we only sign in with some
        this.fetchProfileData();
    }

    private fetchProfileData() {
        (async () => {
            try {
                const user = await LoggedInUserService.fetchLoggedInProfile();
                // If there's no user then an error will have been shown to the user
                user && this.profile$.next(user);
            } catch (e) {
                console.warn(e);
            }
        })();
    }
}