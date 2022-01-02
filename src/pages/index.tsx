import { GetStaticProps } from 'next';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import Head from 'next/head'
import Link from 'next/link'

import Header from '../components/Header';

import { FiCalendar } from 'react-icons/fi'
import { FiUser } from 'react-icons/fi'

import { useState } from 'react'


import Prismic from '@prismicio/client'


interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({postsPagination} : HomeProps) {

  const formattedPost  = postsPagination.results.map((post) => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        "dd MMMM yyyy",
        {
          locale: ptBR,
        }
      )
    }
  })

  

  const [posts , setPosts]= useState<Post[]>(formattedPost);
  const  [next , setNext] = useState(postsPagination.next_page)
  const  [current , setCurrent]  = useState(1)

  async function hanleGetPosts (): Promise<void>  {

    if(current !== 1 && next === null) {
         return ;
    }

    if(next){
     const postsResults = await fetch(`${postsPagination.next_page}`).then(response => response.json())

     const newPost = postsResults.results.map((post) =>{
       return {
           slug: post.uid,
           first_publication_date: format(
             new Date(post.first_publication_date),
             "dd MMMM yyyy",
             {
               locale: ptBR,
             }
           ) ,
           data: {
             title: post.data.title,
             subtitle:  post.data.content.find(content => content.type === 'paragraph')?.text ?? '',
             author: post.data.author
           }
         
       }
     })
      setNext(postsResults.next_page)
      setPosts([...posts, ...newPost])
      setCurrent(current + 1)
    }
  }


   return(
     <>
       <Head children={undefined}>
          <title> Home | spacetraveling </title>
       </Head>

        <main className={commonStyles.container}>
          <Header/>


          <div className={styles.posts}>
              {
                posts.map((post : Post) => {
                  console.log(post);
                  return(
                  
                    <Link href={`post/${post.uid}`} key={post.uid}>
                    <a className={styles.post} >
                      <strong> {post.data.title} </strong>
                      <p>{post.data.subtitle} </p>
                      <ul>
                        <li><FiCalendar/> {post.first_publication_date}</li>
                        <li> <FiUser/> {post.data.author} </li>
                      </ul>
                    </a>
                </Link>
                  )
                })
              }
             { next &&  (<button type="button" onClick={() => hanleGetPosts()}  > carregar mais</button>)}
          </div>
          

        </main>
     </>
   )
}

export const getStaticProps : GetStaticProps= async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
    Prismic.Predicates.at("document.type", "posts")
], {
  pageSize: 1
});

const posts = await postsResponse.results.map((post) => {
  return {
    uid: post.uid,
    first_publication_date: post.first_publication_date ,
    data: {
      title: post.data.title,
      subtitle:  post.data.subtitle,
      author: post.data.author
    }



    
  }
})


const postsPagination = {
  next_page: postsResponse.next_page,
  results: posts
}

return { 
  props: {
    postsPagination,
  }
}
};

