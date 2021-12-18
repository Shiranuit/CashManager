import 'dart:async';

import 'package:cash_manager/components/barcode_area_painter.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_code_scanner/qr_code_scanner.dart';
import 'dart:io';

enum ScanState {
  beforeFirstScan,
  firstScan,
  afterFirstScan,
}

enum AnimationScanState {
  waiting,
  success,
  failure,
  processing,
}

class BarCodeScanner extends StatefulWidget {
  /// Callback called each a barcode is scanned
  FutureOr<bool> Function(Barcode)? onScan;

  /// Delay beetween each scan
  /// [null] means no delay
  /// Default: [null]
  final Duration? scanDelay;

  /// Widget used to optimize rendering
  Widget? child;

  /// Build a widget at the center of the scanner
  Widget? Function(BuildContext, ScanState, Widget?)? builder;

  /// Called after the the Success Animation
  final void Function()? afterSuccessAnimation;

  /// Called after the failure animation
  final void Function()? afterFailureAnimation;

  bool hapticFeedback;

  BarCodeScanner({
    Key? key,
    this.onScan,
    this.scanDelay,
    this.builder,
    this.child,
    this.afterSuccessAnimation,
    this.afterFailureAnimation,
    this.hapticFeedback = true,
  }) : super(key: key);

  @override
  _BarCodeScannerState createState() => _BarCodeScannerState();
}

class _BarCodeScannerState extends State<BarCodeScanner> {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  Color areaColor = Colors.orange;
  QRViewController? _controller;
  late ValueNotifier<ScanState> _scanState;
  late ValueNotifier<AnimationScanState> _animationState;

  @override
  void initState() {
    _scanState = ValueNotifier(ScanState.beforeFirstScan);
    _animationState = ValueNotifier(AnimationScanState.waiting);
    super.initState();
  }

  @override
  void dispose() {
    _scanState.dispose();
    _animationState.dispose();
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

  void _onQRViewCreated(QRViewController controller) {
    _controller = controller;
    controller.scannedDataStream.listen((scanData) async {
      if (widget.onScan != null) {
        if (_animationState.value != AnimationScanState.waiting) {
          return;
        }

        _animationState.value = AnimationScanState.processing;
        bool success = await Future.value(widget.onScan!(scanData));
        if (_scanState.value == ScanState.beforeFirstScan) {
          _scanState.value = ScanState.firstScan;
        } else {
          _scanState.value = ScanState.afterFirstScan;
        }
        if (success) {
          _animationState.value = AnimationScanState.success;
          setState(() {
            areaColor = Colors.green;
          });
          if (widget.hapticFeedback) {
            HapticFeedback.vibrate();
          }
        } else {
          _animationState.value = AnimationScanState.failure;
          setState(() {
            areaColor = Colors.red;
          });
          if (widget.hapticFeedback) {
            HapticFeedback.vibrate();
            await Future.delayed(const Duration(milliseconds: 50));
            HapticFeedback.vibrate();
          }
        }
        await Future.delayed(widget.scanDelay ?? const Duration(seconds: 0));
        _animationState.value = AnimationScanState.waiting;
        setState(() {
          areaColor = Colors.orange;
        });
        if (success) {
          widget.afterSuccessAnimation?.call();
        } else {
          widget.afterFailureAnimation?.call();
        }
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
      ),
      Center(
        child: FractionallySizedBox(
          widthFactor: 0.5,
          heightFactor: 0.5,
          child: Center(
            child: Flexible(
                fit: FlexFit.tight,
                child: ValueListenableBuilder(
                  valueListenable: _scanState,
                  builder: (context, ScanState scanState, child) {
                    return widget.builder
                            ?.call(context, scanState, widget.child) ??
                        Container();
                  },
                )),
          ),
        ),
      )
    ]);
  }
}
