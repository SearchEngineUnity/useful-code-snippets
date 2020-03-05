// This is a front end component for Sanity image using sanity image url builder to result in a <picture> component 
// that contains both webp src set and original data type src set with lazy loading similar to gatsby image
// it does not have the gatsby image's blur up effect


import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useInView } from 'react-intersection-observer';
import clsx from 'clsx';
import { imageUrlFor } from '../../lib/image-url';
import styles from './picture-asset.module.scss';

const defaultBreakpoints = [1200, 1000, 800, 600, 400];
const DEFAULT_MAX_WIDTH = 1780;

function breakPointsToString(image, format = 'jpg', maxWidth = DEFAULT_MAX_WIDTH, breakPoints = defaultBreakpoints) {
  const bpMap = breakPoints
    .filter(breakPoint => breakPoint <= maxWidth)
    .map(breakPoint => {
      const urlBuilder = imageUrlFor(image)
        .width(breakPoint)
        .format(format);
      return `${urlBuilder.url()} ${breakPoint}w`;
    });

  return bpMap.join(', ');
}

/**
 * Component for representing a responsive version of sanity image asset
 * @param image SanityImageAsset object from GraphQL query
 * @param isFluid
 * @param objectFit
 * @param maxWidth
 * @param width
 * @param height
 * @param aspectRatio
 * @param alt
 * @param className
 * @param breakPoints
 * @param loader
 * @param sizes
 * @param otherProps
 * @returns {null|<picture/>}
 * @constructor
 */
const PictureAsset = ({
  image = {},
  isFluid,
  objectFit,
  maxWidth = DEFAULT_MAX_WIDTH,
  width,
  height,
  aspectRatio,
  alt,
  className,
  breakPoints = defaultBreakpoints,
  loader,
  sizes = '',
  ...otherProps
}) => {
  const [show, setShow] = useState(false);
  const [ref, inView] = useInView({ triggerOnce: true });

  const { asset } = image;

  // check if it a valid SanityImage asset
  if (!image.asset || !(image.asset._ref || image.asset._id)) {
    console.error('Not a valid sanity image asset');
    return null;
  }

  const { metadata = {} } = asset;
  const { lqip = '', dimensions = {} } = metadata;

  if (!isFluid && !width && !height) {
    throw new Error('Picture Asset component requires one of isFluid or width or height');
  }

  const { extension, mimeType } = image.asset;

  if (extension === 'svg') {
    //  Early return to avoid all computation below
    return <img src={image.asset.url} alt={alt} className={className} {...otherProps} />;
  }

  let computedWidth;
  let computedHeight;
  let defaultSrcSet;
  let webpSrcSet;
  if (isFluid) {
    computedWidth = '100%';
    if (!height) {
      computedHeight = '100%';
    } else {
      computedHeight = height;
    }
    webpSrcSet = breakPointsToString(image, 'webp', maxWidth, breakPoints);
    defaultSrcSet = breakPointsToString(image, extension, maxWidth, breakPoints);
  } else {
    computedWidth = typeof width === 'number' ? width : maxWidth;
    computedHeight = height || width / dimensions.aspectRatio;

    webpSrcSet = breakPointsToString(image, 'webp', computedWidth, breakPoints);
    defaultSrcSet = breakPointsToString(image, extension, computedWidth, breakPoints);
  }

  const url = imageUrlFor(image)
    .width(maxWidth)
    .url();

  return (
    <div
      ref={ref}
      className={clsx(styles.assetWrapper, className)}
      style={{
        width: computedWidth,
        height: computedHeight,
      }}
    >
      <div className={clsx(styles.hider, show && styles.hide)}>
        {loader || (
          <img
            src={lqip || ''}
            className={clsx(styles.lqip, objectFit === 'cover' ? styles.cover : styles.contain)}
            alt="Placeholder"
          />
        )}
      </div>
      {isFluid && (
        <div
          className={styles.aspectRatio}
          style={{
            paddingTop: `${100 / (aspectRatio || dimensions.aspectRatio)}%`,
          }}
        />
      )}
      <picture className={clsx(styles.picture, show && styles.show)}>
        {inView && (
          <>
            <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
            <source type={mimeType} srcSet={defaultSrcSet} sizes={sizes} />
            <img
              className={clsx(
                styles.image,
                isFluid && styles.fluid,
                objectFit === 'cover' ? styles.cover : styles.contain
              )}
              onLoad={() => {
                setShow(true);
              }}
              src={url}
              srcSet={defaultSrcSet}
              alt={alt}
              sizes={sizes}
            />
          </>
        )}
      </picture>
    </div>
  );
};

PictureAsset.defaultProps = {
  isFluid: false,
  objectFit: 'cover',
  alt: '',
  height: null,
  width: null,
  maxWidth: DEFAULT_MAX_WIDTH,
  className: null,
};

PictureAsset.propTypes = {
  image: PropTypes.shape({}),
  isFluid: PropTypes.bool,
  objectFit: PropTypes.string,
  alt: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  aspectRatio: PropTypes.number,
  maxWidth: PropTypes.number,
  className: PropTypes.string,
  loader: PropTypes.node,
  breakPoints: PropTypes.arrayOf(PropTypes.number),
  sizes: PropTypes.string,
};

export default PictureAsset;
