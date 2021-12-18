FROM cirrusci/flutter:stable

WORKDIR /app

COPY . .
RUN flutter pub get && \
    flutter build apk

RUN mkdir -p /build && \
    cp -f build/app/outputs/apk/release/app-release.apk /build/app.apk

CMD ["echo", "APK BUILT"]