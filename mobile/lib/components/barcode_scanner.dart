import 'dart:async';

import 'package:cash_manager/components/barcode_area_painter.dart';
import 'package:flutter/material.dart';
import 'package:qr_code_scanner/qr_code_scanner.dart';
import 'dart:io';

class BarCodeScanner extends StatefulWidget {
  /// Callback called each a barcode is scanned
  FutureOr<bool> Function(Barcode)? onScan;

  /// Delay beetween each scan
  /// [null] means no delay
  /// Default: [null]
  final Duration? scanDelay;
  BarCodeScanner({Key? key, this.onScan, this.scanDelay}) : super(key: key);

  @override
  _BarCodeScannerState createState() => _BarCodeScannerState();
}

class _BarCodeScannerState extends State<BarCodeScanner> {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  DateTime _dateTime = DateTime(0);
  Color areaColor = Colors.red;
  QRViewController? _controller;

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  void reassemble() {
    super.reassemble();
    if (Platform.isAndroid) {
      _controller?.pauseCamera();
    }
    _controller?.resumeCamera();
  }

  void _updateStatus(bool success) {
    if (success) {
      setState(() {
        areaColor = Colors.green;
      });
    } else {
      setState(() {
        areaColor = Colors.red;
      });
    }
  }

  void _onQRViewCreated(QRViewController controller) {
    _controller = controller;
    controller.scannedDataStream.listen((scanData) async {
      if (widget.onScan != null) {
        if (widget.scanDelay != null &&
            DateTime.now().difference(_dateTime) < widget.scanDelay!) {
          return;
        }
        _dateTime = DateTime.now();
        bool success = await Future.value(widget.onScan!(scanData));
        _updateStatus(success);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Stack(children: [
      QRView(
        key: qrKey,
        onQRViewCreated: _onQRViewCreated,
      ),
      FractionallySizedBox(
        heightFactor: 1,
        widthFactor: 1,
        child: CustomPaint(
          painter: BarcodeAreaPainter(
            color: areaColor,
            outsideOpacity: 0.5,
          ),
        ),
      )
    ]);
  }
}
