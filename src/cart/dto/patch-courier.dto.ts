import { IsNumber, IsString } from "class-validator";


export class PatchCourierDto {
    @IsNumber()
    shippingCostIdr: number;

    @IsString()
    courierName:     string;

    @IsString()
    courierCode:     string;

    @IsString()
    shippingMethod:  string;
}
