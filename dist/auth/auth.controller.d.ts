import { AuthService } from './auth.service';
declare class RegisterDto {
    email: string;
    password: string;
    fullName: string;
    companyName?: string;
    phone?: string;
}
declare class LoginDto {
    email: string;
    password: string;
}
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
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
    login(dto: LoginDto): Promise<{
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
export {};
