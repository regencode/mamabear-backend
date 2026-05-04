import { CallHandler, ExecutionContext, Injectable } from "@nestjs/common";
import { NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { CustomResponse } from "../CustomResponse";
import { map } from "rxjs/operators";
import { Response } from "express";


@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, CustomResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<CustomResponse<T>> {
        const response = context.switchToHttp().getResponse<Response>();
        return next.handle().pipe(
            map((data: T) => ({
                success: true,
                statusCode: response.statusCode,
                message: response.statusMessage || "No message specified",
                data: data,
                timestamp: new Date().toISOString(), 
            })),
        )
    }
}
