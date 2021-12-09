import 'package:flutter/material.dart';

class BarcodeAreaPainter extends CustomPainter {
  final double strokeWidth;
  final double radius;
  final double widthLengthPercent;
  final double heightLengthPercent;
  final double widthSizePercent;
  final double heightSizePercent;
  final Color color;
  final double outsideOpacity;

  BarcodeAreaPainter({
    this.strokeWidth = 6,
    this.radius = 16,
    this.widthLengthPercent = 0.5,
    this.heightLengthPercent = 0.5,
    this.color = Colors.white,
    this.widthSizePercent = 0.5,
    this.heightSizePercent = 0.5,
    this.outsideOpacity = 0.3,
  });

  @override
  void paint(Canvas canvas, Size size) {
    Paint darkenPaint = Paint()
      ..color = Colors.black.withOpacity(outsideOpacity);
    canvas.drawRect(Rect.fromLTRB(0, 0, size.width, size.height), darkenPaint);

    RRect outer = RRect.fromRectAndRadius(
      Rect.fromCenter(
          center: Offset(size.width / 2, size.height / 2),
          width: size.width * widthSizePercent,
          height: size.height * heightSizePercent),
      Radius.circular(radius),
    );
    RRect inner = RRect.fromRectAndRadius(
      Rect.fromCenter(
          center: Offset(size.width / 2, size.height / 2),
          width: size.width * widthSizePercent - strokeWidth,
          height: size.height * heightSizePercent - strokeWidth),
      Radius.circular(radius),
    );

    canvas.drawRRect(outer, Paint()..blendMode = BlendMode.clear);
    canvas.drawDRRect(outer, inner, Paint()..color = color);
    canvas.drawRect(
        Rect.fromCenter(
            center: Offset(size.width / 2, size.height / 2),
            width: size.width * widthSizePercent * widthLengthPercent,
            height: size.height * heightSizePercent + 2),
        Paint()..blendMode = BlendMode.clear);
    canvas.drawRect(
        Rect.fromCenter(
            center: Offset(size.width / 2, size.height / 2),
            width: size.width * widthSizePercent + 2,
            height: size.height * heightSizePercent * heightLengthPercent),
        Paint()..blendMode = BlendMode.clear);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    if (oldDelegate is BarcodeAreaPainter) {
      return oldDelegate.strokeWidth != strokeWidth ||
          oldDelegate.radius != radius ||
          oldDelegate.widthLengthPercent != widthLengthPercent ||
          oldDelegate.heightLengthPercent != heightLengthPercent ||
          oldDelegate.color != color;
    }
    return true;
  }
}
