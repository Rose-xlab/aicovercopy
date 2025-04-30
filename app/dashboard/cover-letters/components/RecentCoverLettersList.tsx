'use client'

import {useState, useEffect} from 'react'
import type {CoverLetter} from '@/types/cover-letter'


export default function RecentCoverLetters(){

    const [coverLetters,setCoverLetters] = usestate<CoverLetter[]>([])

    useEffect(()=>{
        
    },[])
}