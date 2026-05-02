import { Role } from "@prisma/client"
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator"

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    email: string 

    @IsString()
    @IsNotEmpty()
    password: string   

    @IsString()
    @IsNotEmpty()
    name: string

    @IsString()
    @IsNotEmpty()
    phone: string

    @IsEnum(Role)
    @IsOptional()
    role?: Role
    
    @IsBoolean()
    @IsOptional()
    isVerified?: boolean
}
