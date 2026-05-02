import { IsEmail, IsNotEmpty, IsNumberString, IsString, Length } from "class-validator"

export class RegisterUserDto {
    @IsEmail()
    email: string 

    @IsString() 
    @IsNotEmpty() 
    @Length(8, 24)
    password: string 

    @IsString()
    @IsNotEmpty()
    name: string                      

    @IsNumberString()
    @IsNotEmpty()
    phone: string
}
