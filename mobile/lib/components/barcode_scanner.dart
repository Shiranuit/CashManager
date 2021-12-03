import 'package:flutter/material.dart';
import 'package:qr_code_scanner/qr_code_scanner.dart';

class BarCodeScanner extends StatefulWidget {
  /// Callback called each a barcode is scanned
  void Function(Barcode)? onScan;

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

  void _onQRViewCreated(QRViewController controller) {
    controller.scannedDataStream.listen((scanData) {
      if (widget.onScan != null) {
        if (widget.scanDelay != null &&
            DateTime.now().difference(_dateTime) < widget.scanDelay!) {
          return;
        }
        _dateTime = DateTime.now();
        widget.onScan!(scanData);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return QRView(
      key: qrKey,
      onQRViewCreated: _onQRViewCreated,
    );
  }
}
