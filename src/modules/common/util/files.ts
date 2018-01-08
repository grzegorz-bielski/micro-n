import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { promisify } from 'util';
import { HttpStatus, HttpException } from '@nestjs/common';

interface IdecodedStringData {
  extension: string;
  data: Buffer;
}

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const readFileAsync = promisify(fs.readFile);

export const decodeB64Image = (stringData: string): IdecodedStringData => {
  const regExp = /^data:([A-Za-z-+\/]+);base64,(.+)$/;
  const matches = stringData.match(regExp);

  if (matches.length !== 3) {
    throw new HttpException('Invalid image string', HttpStatus.BAD_REQUEST);
  }

  return {
    extension: matches[1].replace('image/', ''),
    data: Buffer.from(matches[2], 'base64'),
  };
};

export const saveImage = async (stringData: string, fileName: string): Promise<string> => {
  const decodedData = decodeB64Image(stringData);
  const generatedName = `${crypto.randomBytes(15).toString('hex')}-${fileName}.${decodedData.extension}`;
  const filePath = path.resolve(__dirname, '../../..', `public/images/${generatedName}`);

  try {
    await writeFileAsync(filePath, decodedData.data, 'base64');
  } catch (error) {
    throw new HttpException('Couldn\'t save image', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  return generatedName;
};

export const deleteImage = async (generatedName: string) => {
  try {
    await unlinkAsync(path.resolve(__dirname, '../../..', `public/images/${generatedName}`));
  } catch (error) {
    throw new HttpException('Couldn\'t delete image', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

export const getImage = async (generatedName: string): Promise<Buffer> => {
  try {
    return await readFileAsync(path.resolve(__dirname, '../../..', `public/images/${generatedName}`));
  } catch (error) {
    throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
};