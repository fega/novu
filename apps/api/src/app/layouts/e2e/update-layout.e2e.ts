import { UserSession } from '@novu/testing';
import { expect } from 'chai';

import { createLayout } from './helpers';

import { LayoutDto } from '../dtos';

const BASE_PATH = '/v1/layouts';

describe('Layout update - /layouts (PATCH)', async () => {
  let session: UserSession;
  let createdLayout: LayoutDto;

  before(async () => {
    session = new UserSession();
    await session.initialize();
    createdLayout = await createLayout(session, 'layout-name-update', true);
  });

  it('should throw validation error for empty payload when not sending a body', async () => {
    const url = `${BASE_PATH}/${createdLayout._id}`;

    const updateResponse = await session.testAgent.patch(url).send();

    const { body } = updateResponse;
    expect(body.statusCode).to.eql(400);
    expect(body.message).to.eql('Payload can not be empty');
  });

  it('should throw validation error for empty payload when sending a body of an empty object', async () => {
    const url = `${BASE_PATH}/${createdLayout._id}`;

    const updateResponse = await session.testAgent.patch(url).send({});

    const { body } = updateResponse;
    expect(body.statusCode).to.eql(400);
    expect(body.message).to.eql('Payload can not be empty');
  });

  it('should update a new layout successfully', async () => {
    const url = `${BASE_PATH}/${createdLayout._id}`;

    const updatedLayoutName = 'layout-name-update';
    const updatedDescription = 'We thought it was more amazing than it is';
    const updatedContent = `{{{body}}}`;
    const updatedVariables = [];

    const updateResponse = await session.testAgent.patch(url).send({
      name: updatedLayoutName,
      description: updatedDescription,
      content: updatedContent,
      variables: updatedVariables,
    });

    expect(updateResponse.statusCode).to.eql(200);

    const updatedBody = updateResponse.body.data;
    expect(updatedBody._id).to.eql(createdLayout._id);
    expect(updatedBody._environmentId).to.eql(session.environment._id);
    expect(updatedBody._organizationId).to.eql(session.organization._id);
    expect(updatedBody._creatorId).to.eql(session.user._id);
    expect(updatedBody.name).to.eql(updatedLayoutName);
    expect(updatedBody.description).to.eql(updatedDescription);
    expect(updatedBody.content).to.eql(updatedContent);
    expect(updatedBody.variables).to.eql(updatedVariables);
    expect(updatedBody.contentType).to.eql('customHtml');
    expect(updatedBody.isDeleted).to.eql(false);
    expect(updatedBody.createdAt).to.be.ok;
    expect(updatedBody.updatedAt).to.be.ok;
  });

  it('should throw a conflict error when a default layout is updated to not be default', async () => {
    const url = `${BASE_PATH}/${createdLayout._id}`;

    const updatedIsDefault = false;

    const updateResponse = await session.testAgent.patch(url).send({
      isDefault: updatedIsDefault,
    });

    expect(updateResponse.statusCode).to.eql(409);
    expect(updateResponse.body).to.eql({
      error: 'Conflict',
      message: `One default layout is required`,
      statusCode: 409,
    });
  });

  it('if the layout updated is assigned as default it should set as non default the existing default layout', async () => {
    const firstLayout = await createLayout(session, 'layout-name-update-first-created', true);
    const secondLayout = await createLayout(session, 'layout-name-update-second-created', false);

    const firstLayoutUrl = `${BASE_PATH}/${firstLayout._id}`;
    const firstLayoutResponse = await session.testAgent.get(firstLayoutUrl);
    expect(firstLayoutResponse.body.data._id).to.eql(firstLayout._id);
    expect(firstLayoutResponse.body.data.isDefault).to.eql(true);

    const secondLayoutUrl = `${BASE_PATH}/${secondLayout._id}`;
    const secondLayoutResponse = await session.testAgent.get(secondLayoutUrl);
    expect(secondLayoutResponse.body.data._id).to.eql(secondLayout._id);
    expect(secondLayoutResponse.body.data.isDefault).to.eql(false);

    // We proceed to set the second layout as default by update
    const updateResponse = await session.testAgent.patch(secondLayoutUrl).send({
      isDefault: true,
    });

    const firstLayoutNonDefaultResponse = await session.testAgent.get(firstLayoutUrl);
    expect(firstLayoutNonDefaultResponse.body.data._id).to.eql(firstLayout._id);
    expect(firstLayoutNonDefaultResponse.body.data.isDefault).to.eql(false);

    const secondLayoutDefaultResponse = await session.testAgent.get(secondLayoutUrl);
    expect(secondLayoutDefaultResponse.body.data._id).to.eql(secondLayout._id);
    expect(secondLayoutDefaultResponse.body.data.isDefault).to.eql(true);
  });
});
