import 'dart:async';

import 'package:cash_manager/models/product.dart';
import 'package:flutter/material.dart';

/// Creates a widget that rebuilds when a [ChangeNotifier] updates.
class ChangeNotifierBuilder<T> extends StatefulWidget {
  /// Object that notifies when there is a change
  final ChangeNotifier notifier;

  /// Function that builds the widget
  final Widget Function(BuildContext context, T? value) builder;

  /// A Child to optimise rebuilds
  final Widget? child;
  const ChangeNotifierBuilder(
      {Key? key, required this.notifier, required this.builder, this.child})
      : super(key: key);

  @override
  _ChangeNotifierBuilderState createState() => _ChangeNotifierBuilderState();
}

class _ChangeNotifierBuilderState extends State<ChangeNotifierBuilder> {
  late StreamController _controller;

  onNotification() {
    _controller.add(null);
  }

  @override
  void initState() {
    _controller = StreamController.broadcast();
    widget.notifier.addListener(onNotification);
    super.initState();
  }

  @override
  void didUpdateWidget(covariant ChangeNotifierBuilder oldWidget) {
    oldWidget.notifier.removeListener(onNotification);
    widget.notifier.addListener(onNotification);

    super.didUpdateWidget(oldWidget);
  }

  @override
  void dispose() {
    widget.notifier.removeListener(onNotification);
    _controller.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder(
      stream: _controller.stream,
      builder: (context, snapshot) {
        return widget.builder(context, widget.child);
      },
    );
  }
}
