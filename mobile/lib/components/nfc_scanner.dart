import 'dart:async';
import 'dart:convert';
import 'package:cash_manager/components/animated_validator.dart';
import 'package:flutter/material.dart';
import 'package:nfc_manager/nfc_manager.dart';

enum NfcState {
  waiting,
  success,
  failure,
  processing,
}

class NFCScanner extends StatefulWidget {
  /// Called when scanned data is available.
  /// return [true] when scanned data is valid
  /// return [false] when scanned data is invalid
  final FutureOr<bool> Function(String)? onScan;

  /// Called when an error occurs during scan.
  final void Function(Object)? onError;
  const NFCScanner({
    Key? key,
    this.onScan,
    this.onError,
  }) : super(key: key);

  @override
  State<StatefulWidget> createState() => NFCScannerState();
}

class NFCScannerState extends State<NFCScanner> with TickerProviderStateMixin {
  late ValueNotifier<NfcState> _state;
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _state = ValueNotifier(NfcState.waiting);
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );
    WidgetsBinding.instance!.addPostFrameCallback((_) => _tagRead());
  }

  @override
  void dispose() {
    NfcManager.instance.stopSession();
    _state.dispose();
    _controller.dispose();
    super.dispose();
  }

  void _tagRead() {
    NfcManager.instance.startSession(onDiscovered: (NfcTag tag) async {
      if (_state.value != NfcState.waiting) {
        return;
      }

      try {
        Ndef? ndef = Ndef.from(tag);
        if (ndef == null) {
          return;
        }

        NdefRecord? record = ndef.cachedMessage?.records.first;

        if (record == null) {
          return;
        }

        if (widget.onScan == null) {
          return;
        }

        _state.value = NfcState.processing;
        _controller.reset();
        bool success = await Future.value(
          widget.onScan!.call(
            ascii.decode(record.payload).substring(3),
          ),
        );
        _state.value = success ? NfcState.success : NfcState.failure;
        _controller.forward().then(
          (value) async {
            await Future.delayed(const Duration(seconds: 1));
            _controller.reverse().whenComplete(
                  () => _state.value = NfcState.waiting,
                );
          },
        );
      } catch (e) {
        widget.onError?.call(e);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black,
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Center(
          child: ValueListenableBuilder(
            valueListenable: _state,
            builder: (BuildContext context, NfcState state, Widget? child) {
              switch (state) {
                case NfcState.waiting:
                  return FittedBox(
                    fit: BoxFit.contain,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.contactless_outlined,
                            size: 60, color: Colors.white),
                        Text(
                          "Waiting for NFC",
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 34),
                        ),
                      ],
                    ),
                  );
                case NfcState.success:
                  return AnimatedValidator(
                    icon: ValidatorIcon.check,
                    controller: _controller,
                    color: Colors.grey[850],
                    backgroundColor: Colors.green,
                    size: 64,
                  );
                case NfcState.failure:
                  return AnimatedValidator(
                    icon: ValidatorIcon.cross,
                    controller: _controller,
                    color: Colors.grey[850],
                    backgroundColor: Colors.red,
                    size: 64,
                  );
                case NfcState.processing:
                  return const SizedBox(
                    width: 64,
                    height: 64,
                    child: CircularProgressIndicator(),
                  );
              }
            },
          ),
        ),
      ),
    );
  }
}
