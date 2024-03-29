import {QuizCardCarousel} from '../../quiz/quiz-card-carousel.component'
import React from 'react'
import {AmpStories} from '@material-ui/icons'
import {TreeMenuNode} from '../tree-menu-node.interface'
import {QUIZ_NODE} from '@shared/'

export const QuizCarouselNode: TreeMenuNode = {
  name: QUIZ_NODE,
  pathname: QUIZ_NODE,
  label: 'Review Flash Cards',
  LeftIcon: () => <AmpStories/>,
}
