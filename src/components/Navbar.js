import React, { useState } from 'react';
import { 
  AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem, 
  Avatar, Box, useMediaQuery, useTheme, Drawer, List, ListItem, ListItemText,
  Badge, InputBase, Tooltip
} from '@mui/material';
import { 
  Menu as MenuIcon, AccountCircle, Work, Description, ExitToApp, 
  Notifications, Search as SearchIcon, Brightness4, Brightness7
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { styled, alpha } from '@mui/material/styles';

const SearchWrapper = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const Navbar = ({ toggleDarkMode, isDarkMode }) => {
  // ... rest of the Navbar component code ...
};

export default Navbar;