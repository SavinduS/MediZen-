const request = require('supertest');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const client = require('prom-client');

// Mock Gemini AI BEFORE requiring app
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => "Mocked AI Response: This is not a diagnosis. 1. Drink water. 2. Rest. 3. Eat soup. Recommend: General Physician."
        }
      })
    })
  }))
}));

const app = require('./index');

describe('AI Symptom Checker API Integration', () => {
    beforeAll(async () => {
        process.env.GEMINI_API_KEY = 'test_key';
        process.env.NODE_ENV = 'test';
    });

    afterAll(async () => {
        // Clean up
        await mongoose.connection.close();
        client.register.clear();
    });

    it('should return 400 if symptoms description is too short', async () => {
        const res = await request(app)
            .post('/')
            .send({ symptoms: 'Too short' });
        
        expect(res.statusCode).toEqual(400);
        expect(res.body.status).toEqual('error');
        expect(res.body.message).toContain('detail');
    });

    it('should return 200 and AI suggestion for valid input', async () => {
        const res = await request(app)
            .post('/')
            .send({ symptoms: 'I have a severe headache and blurred vision for three hours.' });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
        expect(res.body.ai_suggestion).toContain('Mocked AI Response');
    });

    it('should return 200 for health check', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('UP');
    });

    it('should return Prometheus metrics', async () => {
        const res = await request(app).get('/metrics');
        expect(res.statusCode).toEqual(200);
        expect(res.header['content-type']).toContain('text/plain');
        expect(res.text).toContain('symptom_checker_ai_requests_total');
    });
});
