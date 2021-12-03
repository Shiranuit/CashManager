import 'package:flutter/material.dart';

class AnimatedColorFade extends StatefulWidget {
  Widget? child;
  Tween tween;
  Color color;
  Duration duration;
  AnimatedColorFade({
    Key? key,
    this.child,
    required this.tween,
    required this.color,
    required this.duration,
  }) : super(key: key);

  @override
  _AnimatedColorFadeState createState() => _AnimatedColorFadeState();
}

class _AnimatedColorFadeState extends State<AnimatedColorFade>
    with TickerProviderStateMixin {
  late AnimationController _controller;
  late Animation animation;

  @override
  void initState() {
    _controller = AnimationController(
      duration: widget.duration,
      vsync: this,
    );
    animation = widget.tween.animate(_controller);
    _controller.forward();
    super.initState();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        return Container(
          child: widget.child,
          color: widget.color.withOpacity(animation.value),
        );
      },
    );
  }
}
