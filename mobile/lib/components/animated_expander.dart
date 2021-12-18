import 'dart:async';

import 'package:flutter/material.dart';

class AnimatedExpander extends StatefulWidget {
  /// The widget to display when the widget is fully expanded.
  final Widget? child;

  /// The widget to display when the widget is expanding.
  final Widget? expansionChild;

  /// A Stream that notifies when the widget should expand or collapse.
  /// [true] - expand
  /// [false] - collapse
  final Stream<bool> listenable;

  /// Default Expansion State
  /// [true] - expanded
  /// [false] - collapsed
  /// Default: [false]
  final bool defaultExpanded;

  /// The width at which the widget will be expanded.
  final double width;

  /// The height at which the widget will be expanded.
  final double height;

  /// The duration of the expansion animation.
  final Duration duration;

  /// Called when the widget is fully expanded.
  final VoidCallback? onExpanded;

  /// Called when the widget is fully collapsed.
  final VoidCallback? onCollapsed;

  /// Display the child while the widget is expanding.
  final bool useChildAsExpansion;

  /// Called rebuilding during expansion or collapsing
  final Widget? Function(BuildContext, Widget?)? onRebuild;
  AnimatedExpander(
      {Key? key,
      this.child,
      this.expansionChild,
      this.defaultExpanded = false,
      this.useChildAsExpansion = false,
      this.onRebuild,
      this.onExpanded,
      this.onCollapsed,
      required this.duration,
      required this.listenable,
      required this.width,
      required this.height})
      : super(key: key);

  @override
  _AnimatedExpanderState createState() => _AnimatedExpanderState();
}

class _AnimatedExpanderState extends State<AnimatedExpander>
    with TickerProviderStateMixin {
  late ValueNotifier<bool> _expanded;
  late AnimationController _controller;
  late Animation<double> _animation;
  late StreamSubscription<bool> _subscription;

  void _expand() {
    _expanded.value = true;
    _controller.forward().then((value) {
      widget.onExpanded?.call();
    });
  }

  void _collapse() {
    _controller.reverse().then((value) {
      _expanded.value = false;
      widget.onCollapsed?.call();
    });
  }

  void _animate(bool expanded) {
    if (expanded == _expanded.value) {
      return;
    }

    if (expanded) {
      _expand();
    } else {
      _collapse();
    }
  }

  @override
  void dispose() {
    _subscription.cancel();
    _expanded.dispose();
    _controller.dispose();
    super.dispose();
  }

  @override
  void initState() {
    _controller = AnimationController(vsync: this, duration: widget.duration);
    _animation = Tween<double>(begin: 0, end: 1).animate(_controller);
    _expanded = ValueNotifier(widget.defaultExpanded);
    _subscription = widget.listenable.listen(_animate);
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: _expanded,
      builder: (context, value, child) {
        return !value
            ? Container()
            : AnimatedBuilder(
                animation: _animation,
                child: widget.child,
                builder: (context, child) {
                  if (_controller.value != 1) {
                    Widget? expansionWidget = widget.useChildAsExpansion
                        ? widget.child
                        : widget.expansionChild;
                    return SizedBox(
                      width: widget.width * _controller.value,
                      height: widget.height * _controller.value,
                      child: widget.onRebuild != null
                          ? widget.onRebuild!(context, expansionWidget)
                          : expansionWidget,
                    );
                  }
                  return SizedBox(
                    width: widget.width * _controller.value,
                    height: widget.height * _controller.value,
                    child: widget.child,
                  );
                },
              );
      },
    );
  }
}
