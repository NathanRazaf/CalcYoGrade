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
        await request(app)
            .delete('/admin/db/clear')
            .set('Authorization', `Bearer ${adminToken}`);
    }
);


let token1: string, token2: string;

describe('Basic user creation', () => {

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
        token1 = res.body.token;
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


describe('Grade system creation and setup', () => {

    let gradeId: string;
    it('should create a new grade system', async () => {

         // create a new grade system
            const res = await request(app)
                .post('/grades/system/add')
                .send({
                    name: 'Test Grade System',
                    maxGrade: 100,
                    system: [
                        { letterGrade: 'A', minGrade: 90, maxGrade: 100 },
                        { letterGrade: 'B', minGrade: 80, maxGrade: 89 },
                        { letterGrade: 'C', minGrade: 70, maxGrade: 79 },
                        { letterGrade: 'D', minGrade: 60, maxGrade: 69 },
                        { letterGrade: 'F', minGrade: 0, maxGrade: 59 },
                    ],
                })
                .set('Authorization', `Bearer ${token1}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message', 'Grade system set up successfully');
            expect(res.body.gradeSystem).toHaveProperty('name', 'Test Grade System');
            expect(res.body.gradeSystem).toHaveProperty('maxGrade', 100);
            expect(res.body.gradeSystem).toHaveProperty('system');
            gradeId = res.body.gradeSystem._id;
    });

    it('should not create a grade system with invalid minGrade and maxGrade', async () => {
         // create a new grade system
            const res = await request(app)
                .post('/grades/system/add')
                .send({
                    name: 'Test Grade System',
                    maxGrade: 100,
                    system: [
                        { grade: 'A', minGrade: 90, maxGrade: 100 },
                        { grade: 'B', minGrade: 80, maxGrade: 89 },
                        { grade: 'C', minGrade: 70, maxGrade: 79 },
                        { grade: 'D', minGrade: 60, maxGrade: 69 },
                        { grade: 'F', minGrade: 59, maxGrade: 50 },
                    ],
                })
                .set('Authorization', `Bearer ${token1}`);

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('message', 'minGrade and maxGrade must be positive and minGrade must be less than maxGrade for grade F.');
    });

    it('should not create a grade system with overlapping ranges', async () => {
        // create a new grade system
        const res = await request(app)
            .post('/grades/system/add')
            .send({
                name: 'Test Grade System',
                maxGrade: 100,
                system: [
                    { letterGrade: 'A', minGrade: 90, maxGrade: 100 },
                    { letterGrade: 'B', minGrade: 80, maxGrade: 89 },
                    { letterGrade: 'C', minGrade: 70, maxGrade: 79 },
                    { letterGrade: 'D', minGrade: 60, maxGrade: 69 },
                    { letterGrade: 'F', minGrade: 65, maxGrade: 75 },
                ],
            })
            .set('Authorization', `Bearer ${token1}`);

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message', 'Grades D and F have overlapping ranges.');
    });

    it('should set up an existing grade system for the user', async () => {
        // first, connect a user
        const res2 = await request(app)
            .post('/users/login')
            .send({
                username: 'testuser2',
                password: 'testpassword',
            });
        token2 = res2.body.token;

        const res = await request(app)
            .post('/grades/system/add')
            .send({
                gradeSysId: gradeId,
            })
            .set('Authorization', `Bearer ${token2}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Grade system set up successfully');
        expect(res.body.gradeSystem).toHaveProperty('name', 'Test Grade System');
        expect(res.body.gradeSystem).toHaveProperty('maxGrade', 100);
        expect(res.body.gradeSystem).toHaveProperty('usedBy', 2);
    });

    it('should search for a grade system with a given name', async () => {
        const res = await request(app)
            .get('/grades/system/search')
            .query({ query: 'Test Grade System' });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('gradeSystems');
        expect(res.body.gradeSystems).toHaveLength(1);
        expect(res.body.gradeSystems[0]).toHaveProperty('name', 'Test Grade System');
    });

    it('should search for all grade systems', async () => {
        const res = await request(app)
            .get('/grades/system/search')

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('gradeSystems');
        expect(res.body.gradeSystems).toHaveLength(1);
        expect(res.body.gradeSystems[0]).toHaveProperty('name', 'Test Grade System');
    });
});

let courseId: string;
describe('Course creation and setup', () => {
    it('should add a new semester to a user\'s academic path and create a new course in it', async () => {
        const res = await request(app)
            .post('/courses/add')
            .send({
                semester: 'Winter 2024',
                schoolName: 'Test School',
                courseCode: 'TEST101',
                courseName: 'Test Course',
                weight: 3,
                maxPoints: 100,
            })
            .set('Authorization', `Bearer ${token1}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Course added successfully.');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toHaveProperty('academicPath');
        expect(res.body.user.academicPath).toHaveLength(1);
        expect(res.body.user.academicPath[0]).toHaveProperty('semester', 'Winter 2024');
        expect(res.body.user.academicPath[0]).toHaveProperty('courses');
        expect(res.body.user.academicPath[0].courses).toHaveLength(1);
        expect(res.body.user.academicPath[0].courses[0]).toHaveProperty('courseId');
        courseId = res.body.user.academicPath[0].courses[0].courseId;
    });

    it('should add the same course to another user\'s academic path', async () => {
        const res = await request(app)
            .post('/courses/add')
            .send({
                courseId: courseId,
                semester: 'Winter 2024',
            })
            .set('Authorization', `Bearer ${token2}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Course added successfully.');
    });

    let courseEvalId: string;
    it('should create a course evaluation for a course', async () => {
        const res = await request(app)
            .post('/courses/eval/create')
            .send({
                name: 'The standard course evaluation',
                courseId: courseId,
                semester: 'Winter 2024',
                assignments: [
                    { name: 'Midterm Exam', weight: 45, maxPoints: 100 },
                    { name: 'Final Exam', weight: 55, maxPoints: 100 },
                ]
            })
            .set('Authorization', `Bearer ${token1}`);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'Course evaluation created successfully.');
        expect(res.body).toHaveProperty('courseEval');
        expect(res.body.courseEval).toHaveProperty('name', 'The standard course evaluation');
        expect(res.body.courseEval).toHaveProperty('_id');
        courseEvalId = res.body.courseEval._id.toString();
    })

    it('should set up a course evaluation for a course', async () => {
        const res = await request(app)
            .post('/courses/eval/set')
            .send(
                {
                    courseEvalId: courseEvalId
                }
            )
            .set('Authorization', `Bearer ${token1}`);

        const res2 = await request(app)
            .post('/courses/eval/set')
            .send(
                {
                    courseEvalId: courseEvalId
                }
            )
            .set('Authorization', `Bearer ${token2}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Course evaluation set up successfully.');
    });
});

describe('Grade setting and updating', () => {
    it('should set 80 for the Midterm Exam grade', async () => {
       const user = await request(app)
            .get('/users/me')
            .set('Authorization', `Bearer ${token1}`);

        const res = await request(app)
            .post('/grades/set')
            .send({
                semester: 'Winter 2024',
                courseId: courseId,
                assignmentId: user.body.academicPath[0].courses[0].assignments[0]._id,
                grade: 80,
            })
            .set('Authorization', `Bearer ${token1}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Grade updated successfully.');
    });

    it('should set 85 for the Final Exam grade', async () => {
        const user = await request(app)
            .get('/users/me')
            .set('Authorization', `Bearer ${token1}`);

        const res = await request(app)
            .post('/grades/set')
            .send({
                semester: 'Winter 2024',
                courseId: courseId,
                assignmentId: user.body.academicPath[0].courses[0].assignments[1]._id,
                grade: 85,
            })
            .set('Authorization', `Bearer ${token1}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Grade updated successfully.');
    });

    it('should set the final grade for the course', async () => {
        const res = await request(app)
            .post('/grades/confirm')
            .send({
                semester: 'Winter 2024',
                courseId: courseId,
                isFinalGrade: true,
            })
            .set('Authorization', `Bearer ${token1}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Final grade status updated successfully.');
    });
});

describe('Removing course evaluations and courses', () => {
   it('should remove a course from a user', async () => {
         const res = await request(app)
              .delete('/courses/remove')
              .send({
                semester: 'Winter 2024',
                courseId: courseId,
              })
              .set('Authorization', `Bearer ${token1}`);

         expect(res.statusCode).toEqual(200);
         expect(res.body).toHaveProperty('message', 'Course removed successfully.');
   });
});