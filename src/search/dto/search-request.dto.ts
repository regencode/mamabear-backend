import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";


export class SearchRequestDto  {
    @ApiPropertyOptional({ description: "Text search query" }) 
    @IsString()
    @IsNotEmpty()
    q: string;
}

