import 'mocha';
import { assert } from 'chai';
import sinon from 'sinon';
import { randomBytes } from 'crypto';
import { PythiaClient } from '../client/PythiaClient';
import { Connection } from '../client/Connection';
import { Response } from 'node-fetch';

describe('PythiaClient', () => {
	let connectionStub, sendStub;

	beforeEach(() => {
		connectionStub = sinon.createStubInstance(Connection);
		sendStub = connectionStub.send;
	});

	it ('transforms arguments', () => {
		const client = new PythiaClient(connectionStub);

		const params = {
			salt: randomBytes(32),
			blindedPassword: randomBytes(64),
			token: 'stub_jwt'
		};

		const stubResponse = {
			transformed_password: randomBytes(64).toString('base64')
		};

		sendStub.resolves(new Response(JSON.stringify(stubResponse), { status: 200 }));

		return client.transformPassword(params)
			.then(() => {
				assert.isTrue(sendStub.calledOnce, 'sends a single request');
				const call = sendStub.firstCall;
				assert.equal(call.args[0], '/pythia/v1/password', 'passes correct url');
				assert.equal(call.args[1].accessToken, 'stub_jwt', 'passes jwt');
				assert.equal(
					call.args[1].body.blinded_password,
					params.blindedPassword.toString('base64'),
					'passes blinded password correctly'
				);
				assert.equal(
					call.args[1].body.user_id,
					params.salt.toString('base64'),
					'passes user id correctly'
				);
			});
	});

	it ('does not include proof by default', () => {
		const client = new PythiaClient(connectionStub);

		const params = {
			salt: randomBytes(32),
			blindedPassword: randomBytes(64),
			token: 'stub_jwt'
		};

		const stubResponse = {
			transformed_password: randomBytes(64).toString('base64')
		};

		sendStub.resolves(new Response(JSON.stringify(stubResponse), { status: 200 }));

		return client.transformPassword(params)
			.then(() => {
				const call = sendStub.firstCall;
				assert.isUndefined(call.args[1].body.includeProof);
			});
	});

	it ('does not include version by default', () => {
		const client = new PythiaClient(connectionStub);

		const params = {
			salt: randomBytes(32),
			blindedPassword: randomBytes(64),
			token: 'stub_jwt'
		};

		const stubResponse = {
			transformed_password: randomBytes(64).toString('base64')
		};

		sendStub.resolves(new Response(JSON.stringify(stubResponse), { status: 200 }));

		return client.transformPassword(params)
			.then(() => {
				const call = sendStub.firstCall;
				assert.isUndefined(call.args[1].body.version);
			});
	});

	it ('includes proof when explicitly asked to', () => {
		const client = new PythiaClient(connectionStub);

		const params = {
			salt: randomBytes(32),
			blindedPassword: randomBytes(64),
			token: 'stub_jwt',
			includeProof: true
		};

		const stubResponse = {
			transformed_password: randomBytes(64).toString('base64'),
			proof: {
				value_c: randomBytes(16).toString('base64'),
				value_u: randomBytes(16).toString('base64')
			}
		};

		sendStub.resolves(new Response(JSON.stringify(stubResponse), { status: 200 }));

		return client.transformPassword(params)
			.then(() => {
				const call = sendStub.firstCall;
				assert.isTrue(call.args[1].body.include_proof);
			});
	});

	it ('includes version when explicitly asked to', () => {
		const client = new PythiaClient(connectionStub);

		const params = {
			salt: randomBytes(32),
			blindedPassword: randomBytes(64),
			token: 'stub_jwt',
			version: 1
		};

		const stubResponse = {
			transformed_password: randomBytes(64).toString('base64')
		};

		sendStub.resolves(new Response(JSON.stringify(stubResponse), { status: 200 }));

		return client.transformPassword(params)
			.then(() => {
				const call = sendStub.firstCall;
				assert.equal(call.args[1].body.version, 1);
			});
	});

	it ('transforms response', () => {
		const client = new PythiaClient(connectionStub);

		const params = {
			salt: randomBytes(32),
			blindedPassword: randomBytes(64),
			token: 'stub_jwt',
			includeProof: true
		};

		const stubResponse = {
			transformed_password: randomBytes(64).toString('base64'),
			proof: {
				value_c: randomBytes(16).toString('base64'),
				value_u: randomBytes(16).toString('base64')
			}
		};

		sendStub.resolves(new Response(JSON.stringify(stubResponse), { status: 200 }));

		return client.transformPassword(params)
			.then(result => {
				assert.isTrue(Buffer.isBuffer(result.transformedPassword), 'transformed password is a Buffer');
				assert.equal(
					result.transformedPassword.toString('base64'),
					stubResponse.transformed_password,
					'transformed password is correct'
				);
				assert.isTrue(Buffer.isBuffer(result.proof.valueC), 'proof value C is a Buffer');
				assert.equal(
					result.proof.valueC.toString('base64'),
					stubResponse.proof.value_c,
					'proof value C is correct'
				);
				assert.isTrue(Buffer.isBuffer(result.proof.valueU), 'proof value U is a  Buffer');
				assert.equal(
					result.proof.valueU.toString('base64'),
					stubResponse.proof.value_u,
					'proof value U is correct'
				);
			});
	});
});