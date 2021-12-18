import 'package:cached_network_image/cached_network_image.dart';
import 'package:cash_manager/models/product.dart';
import 'package:flutter/material.dart';

class ProductDetailsView extends StatefulWidget {
  final Product product;
  ProductDetailsView({
    Key? key,
    required this.product,
  }) : super(key: key);

  @override
  _ProductDetailsViewState createState() => _ProductDetailsViewState();
}

class _ProductDetailsViewState extends State<ProductDetailsView> {
  Widget buildNutriScore() {
    if (widget.product.nutriScore == null) {
      return Container();
    }

    String grade = widget.product.nutriScore!.toUpperCase();
    Color color = Colors.green;

    switch (grade) {
      case 'A':
        color = Colors.green[900]!;
        break;
      case 'B':
        color = Colors.green;
        break;
      case 'C':
        color = Colors.yellow[700]!;
        break;
      case 'D':
        color = Colors.orange[800]!;
        break;
      case 'E':
        color = Colors.red;
        break;
      default:
        color = Colors.red;
    }

    return Center(
      child: Text(
        grade,
        style: TextStyle(color: color, fontSize: 72),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.product.name ?? 'Unknown Product name'),
      ),
      body: Center(
        child: SingleChildScrollView(
          child: FractionallySizedBox(
            widthFactor: 0.9,
            child: Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 8,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  widget.product.image != null
                      ? ClipRRect(
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(16),
                            topRight: Radius.circular(16),
                          ),
                          child: CachedNetworkImage(
                            imageUrl: widget.product.image!,
                          ),
                        )
                      : Container(),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${widget.product.name}',
                            style: Theme.of(context).textTheme.headline6,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            widget.product.brand ?? '',
                            overflow: TextOverflow.ellipsis,
                            maxLines: 2,
                          ),
                          Text(
                            '${widget.product.price}€',
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.headline6,
                          ),
                        ],
                      ),
                      Container(
                        height: 100,
                        width: 100,
                        decoration: BoxDecoration(
                          borderRadius: const BorderRadius.only(
                            bottomRight: Radius.circular(16),
                          ),
                          color: Theme.of(context).scaffoldBackgroundColor,
                        ),
                        child: buildNutriScore(),
                      )
                    ],
                  )
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
