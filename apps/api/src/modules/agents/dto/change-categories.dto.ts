import { IsArray, ArrayMinSize, IsIn } from 'class-validator';
import { CATEGORY_CODE } from '@landnote/shared';

const validCategories = Object.values(CATEGORY_CODE);

export class ChangeCategoriesDto {
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1개 분야를 선택해야 합니다' })
  @IsIn(validCategories, { each: true, message: '유효하지 않은 카테고리입니다' })
  categories: string[];
}
