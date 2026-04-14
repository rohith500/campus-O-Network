import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from './api/api.config';

export interface Student {
    id: number;
    name: string;
    email: string;
    major: string;
    year: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface StudentPayload {
    name: string;
    email: string;
    major: string;
    year: number;
}

interface ApiStudent {
    id?: number;
    name?: string;
    email?: string;
    major?: string;
    year?: number;
    createdAt?: string;
    updatedAt?: string;
    ID?: number;
    Name?: string;
    Email?: string;
    Major?: string;
    Year?: number;
    CreatedAt?: string;
    UpdatedAt?: string;
}

interface ListStudentsResponse {
    ok?: boolean;
    students?: ApiStudent[];
}

interface StudentResponse {
    ok?: boolean;
    student?: ApiStudent;
}

interface CreateStudentResponse {
    ok?: boolean;
    studentId?: number;
}

@Injectable({ providedIn: 'root' })
export class StudentsService {
    private readonly baseUrl = `${API_BASE_URL}/students`;

    constructor(private readonly http: HttpClient) { }

    listStudents(): Observable<Student[]> {
        return this.http.get<ListStudentsResponse>(this.baseUrl).pipe(
            map((response) => (response.students ?? []).map((student) => this.normalizeStudent(student))),
        );
    }

    getStudent(id: number): Observable<Student> {
        return this.http.get<StudentResponse>(`${this.baseUrl}/${id}`).pipe(
            map((response) => this.normalizeStudent(response.student ?? {})),
        );
    }

    createStudent(payload: StudentPayload): Observable<number> {
        return this.http.post<CreateStudentResponse>(this.baseUrl, payload).pipe(
            map((response) => Number(response.studentId ?? 0)),
        );
    }

    updateStudent(id: number, payload: StudentPayload): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
    }

    deleteStudent(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    private normalizeStudent(student: ApiStudent): Student {
        return {
            id: student.id ?? student.ID ?? 0,
            name: student.name ?? student.Name ?? '',
            email: student.email ?? student.Email ?? '',
            major: student.major ?? student.Major ?? '',
            year: Number(student.year ?? student.Year ?? 0),
            createdAt: student.createdAt ?? student.CreatedAt,
            updatedAt: student.updatedAt ?? student.UpdatedAt,
        };
    }
}
