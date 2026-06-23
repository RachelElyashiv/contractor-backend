import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(data: {
        email: string;
        password: string;
        fullName: string;
        companyName?: string;
        phone?: string;
    }): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string;
            role: string;
            companyName: string;
            avatarUrl: string;
            projects: import("../projects/project.entity").Project[];
            createdAt: Date;
            updatedAt: Date;
        };
        token: string;
    }>;
    login(email: string, password: string): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string;
            role: string;
            companyName: string;
            avatarUrl: string;
            projects: import("../projects/project.entity").Project[];
            createdAt: Date;
            updatedAt: Date;
        };
        token: string;
    }>;
}
