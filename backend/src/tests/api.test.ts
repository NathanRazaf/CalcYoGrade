import request from 'supertest';
import app from '../index';

beforeAll(
    async () => {
        await request(app)
            .post('/users/register')
            .send({
                username: process.env.ADMIN_USERNAME,
                password: process.env.ADMIN_PASSWORD,
            });
        const res = await request(app)
            .post('/users/login')
            .send({
                username: process.env.ADMIN_USERNAME,
                password: process.env.ADMIN_PASSWORD,
            });
        const adminToken = res.body.token;
        const res2 = await request(app)
            .delete('/admin/db/clear')
            .set('Authorization', `Bearer ${adminToken}`);
        console.log(res2.body);
    }
);


describe('User API Endpoints', () => {

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/users/register')
            .send({
                username: 'testuser',
                password: 'testpassword',
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'User registered successfully.');
    });

    it('should not register a user with the same username', async () => {
        const res = await request(app)
            .post('/users/register')
            .send({
                username: 'testuser',
                password: 'testpassword',
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message', 'User with this username already exists.');
    });

    it('should register another new user', async () => {
        const res = await request(app)
            .post('/users/register')
            .send({
                username: 'testuser2',
                password: 'testpassword',
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'User registered successfully.');
    });

    it('should log in the user', async () => {
        const res = await request(app)
            .post('/users/login')
            .send({
                username: 'testuser',
                password: 'testpassword',
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token'); // JWT token should be returned
    });

    it('should not log in the user with invalid credentials', async () => {
        const res = await request(app)
            .post('/users/login')
            .send({
                username: 'testuser',
                password: 'wrongpassword',
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message', 'Invalid credentials.');
    });
});


describe('Grade API Endpoints', () => {

    let gradeId: string;
    it('should create a new grade system', async () => {
        // first, connect a user
         const res = await request(app)
              .post('/users/login')
              .send({
                username: 'testuser',
                password: 'testpassword',
              });
         const token = res.body.token;

         // create a new grade system
            const res2 = await request(app)
                .post('/grades/system/add')
                .send({
                    name: 'Test Grade System',
                    maxPoints: 100,
                    system: [
                        { grade: 'A', minPoints: 90, maxPoints: 100 },
                        { grade: 'B', minPoints: 80, maxPoints: 89 },
                        { grade: 'C', minPoints: 70, maxPoints: 79 },
                        { grade: 'D', minPoints: 60, maxPoints: 69 },
                        { grade: 'F', minPoints: 0, maxPoints: 59 },
                    ],
                })
                .set('Authorization', `Bearer ${token}`);

            expect(res2.statusCode).toEqual(200);
            expect(res2.body).toHaveProperty('message', 'Grade system set up successfully');
            expect(res2.body.gradeSystem).toHaveProperty('name', 'Test Grade System');
            expect(res2.body.gradeSystem).toHaveProperty('maxPoints', 100);
            expect(res2.body.gradeSystem).toHaveProperty('system');
            gradeId = res2.body.gradeSystem._id;
    });

    it('should not create a grade system with invalid minPoints and maxPoints', async () => {
        // first, connect a user
         const res = await request(app)
              .post('/users/login')
              .send({
                username: 'testuser',
                password: 'testpassword',
              });
         const token = res.body.token;

         // create a new grade system
            const res2 = await request(app)
                .post('/grades/system/add')
                .send({
                    name: 'Test Grade System',
                    maxPoints: 100,
                    system: [
                        { grade: 'A', minPoints: 90, maxPoints: 100 },
                        { grade: 'B', minPoints: 80, maxPoints: 89 },
                        { grade: 'C', minPoints: 70, maxPoints: 79 },
                        { grade: 'D', minPoints: 60, maxPoints: 69 },
                        { grade: 'F', minPoints: 59, maxPoints: 50 },
                    ],
                })
                .set('Authorization', `Bearer ${token}`);

            expect(res2.statusCode).toEqual(400);
            expect(res2.body).toHaveProperty('message', 'minPoints and maxPoints must be positive and minPoints must be less than maxPoints for grade F.');
    });

    it('should not create a grade system with overlapping ranges', async () => {
        // first, connect a user
        const res = await request(app)
            .post('/users/login')
            .send({
                username: 'testuser',
                password: 'testpassword',
            });
        const token = res.body.token;

        // create a new grade system
        const res2 = await request(app)
            .post('/grades/system/add')
            .send({
                name: 'Test Grade System',
                maxPoints: 100,
                system: [
                    { grade: 'A', minPoints: 90, maxPoints: 100 },
                    { grade: 'B', minPoints: 80, maxPoints: 89 },
                    { grade: 'C', minPoints: 70, maxPoints: 79 },
                    { grade: 'D', minPoints: 60, maxPoints: 69 },
                    { grade: 'F', minPoints: 65, maxPoints: 75 },
                ],
            })
            .set('Authorization', `Bearer ${token}`);

        expect(res2.statusCode).toEqual(400);
        expect(res2.body).toHaveProperty('message', 'Grades D and F have overlapping ranges.');
    });

    it('should set up an existing grade system for the user', async () => {
        // first, connect a user
        const res = await request(app)
            .post('/users/login')
            .send({
                username: 'testuser2',
                password: 'testpassword',
            });
        const token = res.body.token;

        const res2 = await request(app)
            .post('/grades/system/add')
            .send({
                gradeSysId: gradeId,
            })
            .set('Authorization', `Bearer ${token}`);

        expect(res2.statusCode).toEqual(200);
        expect(res2.body).toHaveProperty('message', 'Grade system set up successfully');
        expect(res2.body.gradeSystem).toHaveProperty('name', 'Test Grade System');
        expect(res2.body.gradeSystem).toHaveProperty('maxPoints', 100);
        expect(res2.body.gradeSystem).toHaveProperty('numUsers', 2);
    });
});
