import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): any;
    updateProfile(req: any, body: any): Promise<import("./user.entity").User>;
}
