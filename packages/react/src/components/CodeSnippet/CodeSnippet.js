/**
 * Copyright IBM Corp. 2016, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import PropTypes from 'prop-types';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import useResizeObserver from 'use-resize-observer/polyfilled';
import { ChevronDown } from '@carbon/icons-react';
import Copy from '../Copy';
import Button from '../Button';
import CopyButton from '../CopyButton';
import getUniqueId from '../../tools/uniqueId';
import copy from 'copy-to-clipboard';
import deprecate from '../../prop-types/deprecate';
import { usePrefix } from '../../internal/usePrefix';

const rowHeightInPixels = 16;
const defaultMaxCollapsedNumberOfRows = 15;
const defaultMaxExpandedNumberOfRows = 0;
const defaultMinCollapsedNumberOfRows = 3;
const defaultMinExpandedNumberOfRows = 16;

function CodeSnippet({
  align = 'bottom',
  className,
  type,
  children,
  disabled,
  feedback,
  feedbackTimeout,
  onClick,
  ['aria-label']: ariaLabel,
  ariaLabel: deprecatedAriaLabel,
  copyText,
  copyButtonDescription,
  light,
  showMoreText,
  showLessText,
  hideCopyButton,
  wrapText,
  maxCollapsedNumberOfRows = defaultMaxCollapsedNumberOfRows,
  maxExpandedNumberOfRows = defaultMaxExpandedNumberOfRows,
  minCollapsedNumberOfRows = defaultMinCollapsedNumberOfRows,
  minExpandedNumberOfRows = defaultMinExpandedNumberOfRows,
  ...rest
}) {
  const [expandedCode, setExpandedCode] = useState(false);
  const [shouldShowMoreLessBtn, setShouldShowMoreLessBtn] = useState(false);
  const { current: uid } = useRef(getUniqueId());
  const codeContentRef = useRef();
  const codeContainerRef = useRef();
  const innerCodeRef = useRef();
  const [hasLeftOverflow, setHasLeftOverflow] = useState(false);
  const [hasRightOverflow, setHasRightOverflow] = useState(false);
  const getCodeRef = useCallback(() => {
    if (type === 'single') {
      return codeContainerRef;
    }
    if (type === 'multi') {
      return codeContentRef;
    }
  }, [type]);
  const prefix = usePrefix();

  const getCodeRefDimensions = useCallback(() => {
    const {
      clientWidth: codeClientWidth,
      scrollLeft: codeScrollLeft,
      scrollWidth: codeScrollWidth,
    } = getCodeRef().current;

    return {
      horizontalOverflow: codeScrollWidth > codeClientWidth,
      codeClientWidth,
      codeScrollWidth,
      codeScrollLeft,
    };
  }, [getCodeRef]);

  const handleScroll = useCallback(() => {
    if (
      type === 'inline' ||
      (type === 'single' && !codeContainerRef?.current) ||
      (type === 'multi' && !codeContentRef?.current)
    ) {
      return;
    }

    const {
      horizontalOverflow,
      codeClientWidth,
      codeScrollWidth,
      codeScrollLeft,
    } = getCodeRefDimensions();

    setHasLeftOverflow(horizontalOverflow && !!codeScrollLeft);
    setHasRightOverflow(
      horizontalOverflow && codeScrollLeft + codeClientWidth !== codeScrollWidth
    );
  }, [type, getCodeRefDimensions]);

  useResizeObserver(
    {
      ref: getCodeRef(),
      onResize: () => {
        if (codeContentRef?.current && type === 'multi') {
          const { height } = codeContentRef.current.getBoundingClientRect();

          if (
            maxCollapsedNumberOfRows > 0 &&
            (maxExpandedNumberOfRows <= 0 ||
              maxExpandedNumberOfRows > maxCollapsedNumberOfRows) &&
            height > maxCollapsedNumberOfRows * rowHeightInPixels
          ) {
            setShouldShowMoreLessBtn(true);
          } else {
            setShouldShowMoreLessBtn(false);
          }
          if (
            expandedCode &&
            minExpandedNumberOfRows > 0 &&
            height <= minExpandedNumberOfRows * rowHeightInPixels
          ) {
            setExpandedCode(false);
          }
        }
        if (
          (codeContentRef?.current && type === 'multi') ||
          (codeContainerRef?.current && type === 'single')
        ) {
          handleScroll();
        }
      },
    },
    [
      type,
      maxCollapsedNumberOfRows,
      maxExpandedNumberOfRows,
      minExpandedNumberOfRows,
      rowHeightInPixels,
    ]
  );

  useEffect(() => {
    handleScroll();
  }, [handleScroll]);

  const handleCopyClick = (evt) => {
    if (copyText || innerCodeRef?.current) {
      copy(copyText ?? innerCodeRef?.current?.innerText);
    }

    if (onClick) {
      onClick(evt);
    }
  };

  const codeSnippetClasses = classNames(className, `${prefix}--snippet`, {
    [`${prefix}--snippet--${type}`]: type,
    [`${prefix}--snippet--disabled`]: type !== 'inline' && disabled,
    [`${prefix}--snippet--expand`]: expandedCode,
    [`${prefix}--snippet--light`]: light,
    [`${prefix}--snippet--no-copy`]: hideCopyButton,
    [`${prefix}--snippet--wraptext`]: wrapText,
    [`${prefix}--snippet--has-right-overflow`]:
      type == 'multi' && hasRightOverflow,
  });

  const expandCodeBtnText = expandedCode ? showLessText : showMoreText;

  if (type === 'inline') {
    if (hideCopyButton) {
      return (
        <span className={codeSnippetClasses}>
          <code id={uid} ref={innerCodeRef}>
            {children}
          </code>
        </span>
      );
    }

    return (
      <Copy
        {...rest}
        align={align}
        onClick={handleCopyClick}
        aria-label={deprecatedAriaLabel || ariaLabel}
        aria-describedby={uid}
        className={codeSnippetClasses}
        feedback={feedback}
        feedbackTimeout={feedbackTimeout}>
        <code id={uid} ref={innerCodeRef}>
          {children}
        </code>
      </Copy>
    );
  }

  let containerStyle = {};
  if (type === 'multi') {
    const styles = {};

    if (expandedCode) {
      if (maxExpandedNumberOfRows > 0) {
        styles.maxHeight = maxExpandedNumberOfRows * rowHeightInPixels;
      }
      if (minExpandedNumberOfRows > 0) {
        styles.minHeight = minExpandedNumberOfRows * rowHeightInPixels;
      }
    } else {
      if (maxCollapsedNumberOfRows > 0) {
        styles.maxHeight = maxCollapsedNumberOfRows * rowHeightInPixels;
      }
      if (minCollapsedNumberOfRows > 0) {
        styles.minHeight = minCollapsedNumberOfRows * rowHeightInPixels;
      }
    }

    if (Object.keys(styles).length) {
      containerStyle.style = styles;
    }
  }

  return (
    <div {...rest} className={codeSnippetClasses}>
      <div
        ref={codeContainerRef}
        role={type === 'single' || type === 'multi' ? 'textbox' : null}
        tabIndex={
          (type === 'single' || type === 'multi') && !disabled ? 0 : null
        }
        className={`${prefix}--snippet-container`}
        aria-label={deprecatedAriaLabel || ariaLabel || 'code-snippet'}
        aria-readonly={type === 'single' || type === 'multi' ? true : null}
        aria-multiline={type === 'multi' ? true : null}
        onScroll={(type === 'single' && handleScroll) || null}
        {...containerStyle}>
        <pre
          ref={codeContentRef}
          onScroll={(type === 'multi' && handleScroll) || null}>
          <code ref={innerCodeRef}>{children}</code>
        </pre>
      </div>
      {/**
       * left overflow indicator must come after the snippet due to z-index and
       * snippet focus border overlap
       */}
      {hasLeftOverflow && (
        <div className={`${prefix}--snippet__overflow-indicator--left`} />
      )}
      {hasRightOverflow && type !== 'multi' && (
        <div className={`${prefix}--snippet__overflow-indicator--right`} />
      )}
      {!hideCopyButton && (
        <CopyButton
          align={align}
          size={type === 'multi' ? 'sm' : 'md'}
          disabled={disabled}
          onClick={handleCopyClick}
          feedback={feedback}
          feedbackTimeout={feedbackTimeout}
          iconDescription={copyButtonDescription}
        />
      )}
      {shouldShowMoreLessBtn && (
        <Button
          kind="ghost"
          size="sm"
          className={`${prefix}--snippet-btn--expand`}
          disabled={disabled}
          onClick={() => setExpandedCode(!expandedCode)}>
          <span className={`${prefix}--snippet-btn--text`}>
            {expandCodeBtnText}
          </span>
          <ChevronDown
            className={`${prefix}--icon-chevron--down ${prefix}--snippet__icon`}
            name="chevron--down"
            role="img"
          />
        </Button>
      )}
    </div>
  );
}

CodeSnippet.propTypes = {
  /**
   * Specify how the trigger should align with the tooltip
   */
  align: PropTypes.oneOf([
    'top',
    'top-left',
    'top-right',
    'bottom',
    'bottom-left',
    'bottom-right',
    'left',
    'right',
  ]),

  /**
   * Specify a label to be read by screen readers on the containing <textbox>
   * node
   */
  ['aria-label']: PropTypes.string,

  /**
   * Deprecated, please use `aria-label` instead.
   * Specify a label to be read by screen readers on the containing <textbox>
   * node
   */
  ariaLabel: deprecate(
    PropTypes.string,
    'This prop syntax has been deprecated. Please use the new `aria-label`.'
  ),

  /**
   * Provide the content of your CodeSnippet as a node or string
   */
  children: PropTypes.node,

  /**
   * Specify an optional className to be applied to the container node
   */
  className: PropTypes.string,

  /**
   * Specify the description for the Copy Button
   */
  copyButtonDescription: PropTypes.string,

  /**
   * Optional text to copy. If not specified, the `children` node's `innerText`
   * will be used as the copy value.
   */
  copyText: PropTypes.string,

  /**
   * Specify whether or not the CodeSnippet should be disabled
   */
  disabled: PropTypes.bool,

  /**
   * Specify the string displayed when the snippet is copied
   */
  feedback: PropTypes.string,

  /**
   * Specify the time it takes for the feedback message to timeout
   */
  feedbackTimeout: PropTypes.number,

  /**
   * Specify whether or not a copy button should be used/rendered.
   */
  hideCopyButton: PropTypes.bool,

  /**
   * Specify whether you are using the light variant of the Code Snippet,
   * typically used for inline snippet to display an alternate color
   */

  light: deprecate(
    PropTypes.bool,
    'The `light` prop for `CodeSnippet` has ' +
      'been deprecated in favor of the new `Layer` component. It will be removed in the next major release.'
  ),

  /**
   * Specify the maximum number of rows to be shown when in collapsed view
   */
  maxCollapsedNumberOfRows: PropTypes.number,

  /**
   * Specify the maximum number of rows to be shown when in expanded view
   */
  maxExpandedNumberOfRows: PropTypes.number,

  /**
   * Specify the minimum number of rows to be shown when in collapsed view
   */
  minCollapsedNumberOfRows: PropTypes.number,

  /**
   * Specify the minimum number of rows to be shown when in expanded view
   */
  minExpandedNumberOfRows: PropTypes.number,

  /**
   * An optional handler to listen to the `onClick` even fired by the Copy
   * Button
   */
  onClick: PropTypes.func,

  /**
   * Specify a string that is displayed when the Code Snippet has been
   * interacted with to show more lines
   */
  showLessText: PropTypes.string,

  /**
   * Specify a string that is displayed when the Code Snippet text is more
   * than 15 lines
   */
  showMoreText: PropTypes.string,

  /**
   * Provide the type of Code Snippet
   */
  type: PropTypes.oneOf(['single', 'inline', 'multi']),

  /**
   * Specify whether or not to wrap the text.
   */
  wrapText: PropTypes.bool,
};

CodeSnippet.defaultProps = {
  ['aria-label']: 'Copy to clipboard',
  type: 'single',
  showMoreText: 'Show more',
  showLessText: 'Show less',
  wrapText: false,
};

export default CodeSnippet;
