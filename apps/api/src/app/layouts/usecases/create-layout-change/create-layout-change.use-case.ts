import { LayoutEntity, LayoutRepository } from '@novu/dal';
import { ChangeEntityTypeEnum } from '@novu/shared';
import { Injectable } from '@nestjs/common';

import { CreateLayoutChangeCommand } from './create-layout-change.command';

import { FindDeletedLayoutCommand, FindDeletedLayoutUseCase } from '../find-deleted-layout';

import { CreateChange, CreateChangeCommand } from '../../../change/usecases';

@Injectable()
export class CreateLayoutChangeUseCase {
  constructor(
    private createChange: CreateChange,
    private findDeletedLayout: FindDeletedLayoutUseCase,
    private layoutRepository: LayoutRepository
  ) {}

  async execute(command: CreateLayoutChangeCommand, isDeleteChange = false): Promise<void> {
    const item = isDeleteChange
      ? await this.findDeletedLayout.execute(FindDeletedLayoutCommand.create(command))
      : await this.layoutRepository.findOne({
          _id: command.layoutId,
          _environmentId: command.environmentId,
          _organizationId: command.organizationId,
        });

    if (item) {
      const changeId = LayoutRepository.createObjectId();

      await this.createChange.execute(
        CreateChangeCommand.create({
          organizationId: command.organizationId,
          environmentId: command.environmentId,
          userId: command.userId,
          type: ChangeEntityTypeEnum.LAYOUT,
          item,
          changeId,
        })
      );
    }
  }
}
