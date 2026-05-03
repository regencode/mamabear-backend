import { IsEmail, IsNotEmpty, IsString } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class LoginUserDto {
    @ApiProperty({ example: "user@email.com" })
    @IsEmail()
    email: string;

    @ApiProperty({ example: "password123" })
    @IsString()
    @IsNotEmpty()
    password: string;
}
