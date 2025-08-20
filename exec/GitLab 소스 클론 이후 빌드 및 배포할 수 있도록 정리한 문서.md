## 1️⃣ **GitLab 소스 클론 이후 빌드 및 배포할 수 있도록 정리한 문서**

### **개발 환경 및 버전 정보**

```
• JDK: OpenJDK 21
• Spring Boot: 3.5.3
• Gradle: 8.x (with wrapper)
• Node.js: 20.x
• React: 19.1.0 + Vite 7.x
• Docker: 24.x
• Docker Compose: 2.x
• IDE: IntelliJ IDEA 2024.x (권장)
```

### **빌드 시 사용되는 환경 변수들의 내용**

```bash
# 필수 환경 변수
SPRING_PROFILES_ACTIVE=prod/dev
DB_URL=jdbc:mysql://ssafy-mysql-db.mysql.database.azure.com:3306/s13p12a607?useSSL=true&requireSSL=true&serverTimezone=Asia/Seoul&allowPublicKeyRetrieval=true
DB_USERNAME=S13P12A607
DB_PASSWORD=adQvdDeJAw
DB_DRIVER=com.mysql.cj.jdbc.Driver
SPRING_JWT_SECRET=ssafy13a607tomatomatotdcssafy13a607tomatomatotdcssafy13a607tomatomatotdc
GMS_API_KEY=S13P11A607-b021a9ff-42b9-4190-b36f-7a10d79edeaa
VITE_AMPLITUDE_API_KEY=4d1d0b615dd50c661f774cec4963a0bd
VITE_GOOGLE_CLIENT_ID=708608569005-0ftpd2vodaiu7t9aj9r50350eq58ilo1.apps.googleusercontent.com
```

### **배포 시 특이사항**

```
• Docker Compose로 운영/개발 환경 완전 분리
• Nginx 리버스 프록시를 통한 API 라우팅 (/api/* → Spring Boot)
• 프론트엔드 정적 파일은 Nginx에서 직접 서빙
• MySQL/Redis는 외부 서버 연결 (컨테이너 분리)
• GitLab CI/CD 파이프라인: develop-* 브랜치 → 개발서버, master → 운영서버
• SSL 인증서 자동 갱신 (Let's Encrypt)
• WebSocket 실시간 통신 지원 (/ws/*
```

### **주요 설정 파일 및 프로퍼티**

```
• application.properties (기본 Spring Boot 설정)
• application-prod.properties (운영 DB 정보)
• application-dev.properties (개발 DB 정보)
• docker-compose.yml (운영), docker-compose.dev.yml (개발)
• nginx.conf (운영), nginx.dev.conf (개발 웹서버 설정)
• .gitlab-ci.yml (CI/CD 파이프라인 자동화)
```