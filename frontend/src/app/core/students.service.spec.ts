import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { API_BASE_URL } from './api/api.config';
import { authInterceptor } from './auth.interceptor';
import { StudentsService } from './students.service';

describe('StudentsService', () => {
    let service: StudentsService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([authInterceptor])),
                provideHttpClientTesting(),
            ],
        });

        service = TestBed.inject(StudentsService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('calls GET /students', () => {
        let received: unknown;
        service.listStudents().subscribe((students) => {
            received = students;
        });

        const req = httpMock.expectOne(`${API_BASE_URL}/students`);
        expect(req.request.method).toBe('GET');
        req.flush({
            ok: true,
            students: [
                {
                    id: 1,
                    name: 'Jane Doe',
                    email: 'jane@uf.edu',
                    major: 'CS',
                    year: 3,
                },
            ],
        });

        expect(received).toEqual([
            {
                id: 1,
                name: 'Jane Doe',
                email: 'jane@uf.edu',
                major: 'CS',
                year: 3,
                createdAt: undefined,
                updatedAt: undefined,
            },
        ]);
    });

    it('calls POST /students', () => {
        let received = 0;
        service
            .createStudent({
                name: 'Jane Doe',
                email: 'jane@uf.edu',
                major: 'CS',
                year: 3,
            })
            .subscribe((studentId) => {
                received = studentId;
            });

        const req = httpMock.expectOne(`${API_BASE_URL}/students`);
        expect(req.request.method).toBe('POST');
        req.flush({ ok: true, studentId: 9 });

        expect(received).toBe(9);
    });

    it('calls GET /students/{id}', () => {
        let received: unknown;
        service.getStudent(5).subscribe((student) => {
            received = student;
        });

        const req = httpMock.expectOne(`${API_BASE_URL}/students/5`);
        expect(req.request.method).toBe('GET');
        req.flush({
            ok: true,
            student: {
                id: 5,
                name: 'John Smith',
                email: 'john@uf.edu',
                major: 'Math',
                year: 2,
            },
        });

        expect(received).toEqual({
            id: 5,
            name: 'John Smith',
            email: 'john@uf.edu',
            major: 'Math',
            year: 2,
            createdAt: undefined,
            updatedAt: undefined,
        });
    });

    it('calls PUT /students/{id}', () => {
        service
            .updateStudent(4, {
                name: 'John Smith',
                email: 'john@uf.edu',
                major: 'Math',
                year: 2,
            })
            .subscribe();

        const req = httpMock.expectOne(`${API_BASE_URL}/students/4`);
        expect(req.request.method).toBe('PUT');
        req.flush({ ok: true });
    });

    it('calls DELETE /students/{id}', () => {
        service.deleteStudent(4).subscribe();

        const req = httpMock.expectOne(`${API_BASE_URL}/students/4`);
        expect(req.request.method).toBe('DELETE');
        req.flush({ ok: true });
    });
});
