import { IsArray, ArrayMinSize, IsIn } from 'class-validator';
import { SUBCATEGORIES } from '@landnote/shared';

const validSubcategories = Object.values(SUBCATEGORIES).flatMap(group => Object.values(group).flat());

export class ChangeCategoriesDto {
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1개 세부 업종을 선택해야 합니다' })
  @IsIn(validSubcategories, { each: true, message: '유효하지 않은 세부 업종입니다' })
  categories: string[];
}
