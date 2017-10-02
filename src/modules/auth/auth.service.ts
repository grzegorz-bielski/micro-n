import { Component } from '@nestjs/common';
import { HttpException } from '@nestjs/core';
import { HttpStatus } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Component()
export class AuthService {
  private signOptions = {
    expiresIn: '7d',
  };

  constructor(
    //
  ) {}

  public async createAccessToken(data: object) {
    try {
      const token = await this.sign(data, this.signOptions);
      return token.toString();
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private sign(data: object, options: jwt.SignOptions) {
    console.log('sign data', data);
    return new Promise((resolve, reject) => {
      jwt.sign(data, process.env.JWT_SECRET, options, (error, token) => {
        if (error || !token) {
          reject(error);
        } else {
          resolve(token);
        }
      });
    });
  }
}
